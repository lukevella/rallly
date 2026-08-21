import { prisma } from "@rallly/database";

/**
 * Backfills `Space.spaceType` from PostHog history.
 *
 * The setup flow has always asked whether a space is personal or for work,
 * but until this feature the answer only reached PostHog as the `space_type`
 * property on `space_setup` — never the database, so it could not be joined
 * in SQL. Every one of those events names its space through the `space`
 * group key, which is what makes the answer recoverable.
 *
 * Spaces created before the `space_setup` event existed, and spaces whose
 * event is outside PostHog's retention window, stay null. Null is not a
 * third value: it means unknown, and the product treats it as "not a work
 * space" (no prompt, no alert).
 *
 * Only fills nulls. A space whose type the user has since confirmed in the
 * app is never overwritten by a historical event.
 *
 * DRY RUN by default — prints totals and a sample. Pass --apply to write.
 *
 * Usage:
 *   pnpm --filter @rallly/posthog backfill-space-type
 *   pnpm --filter @rallly/posthog backfill-space-type -- --apply
 *
 * Requires in packages/posthog/.env (see .env.sample):
 *   POSTHOG_PERSONAL_API_KEY  personal API key with query:read
 *   POSTHOG_PROJECT_ID
 *   POSTHOG_API_HOST          optional, defaults to https://us.posthog.com
 *   DATABASE_URL
 */

const API_HOST = process.env.POSTHOG_API_HOST ?? "https://us.posthog.com";
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;

const SAMPLE_SIZE = 10;
// HogQL rows per keyset page. OFFSET is rejected for personal API keys, so
// pagination walks the group key instead.
const PAGE_SIZE = 10000;
// Postgres caps a statement at 65535 bind parameters; updateMany takes one
// per id plus the value, so stay well clear.
const UPDATE_BATCH_SIZE = 1000;
const MAX_RATE_LIMIT_RETRIES = 5;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiRequest({
  path,
  method = "GET",
  body,
}: {
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API_HOST}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 429) {
      if (attempt >= MAX_RATE_LIMIT_RETRIES) {
        throw new Error(`Rate limited on ${path} after ${attempt} retries`);
      }
      const retryAfter = Number(res.headers.get("Retry-After")) || 60;
      console.info(`⏳ Rate limited — waiting ${retryAfter}s before retrying`);
      await sleep(retryAfter * 1000);
      continue;
    }

    if (!res.ok) {
      throw new Error(`${method} ${path} → ${res.status}: ${await res.text()}`);
    }

    return res.status === 204 ? null : res.json();
  }
}

async function hogqlQuery(query: string): Promise<unknown[][]> {
  const data = await apiRequest({
    path: `/api/projects/${PROJECT_ID}/query/`,
    method: "POST",
    body: { query: { kind: "HogQLQuery", query } },
  });
  return data.results ?? [];
}

// Escape a space id for safe interpolation into a HogQL string literal. The
// values come from PostHog itself, but keep the escape so a malformed one
// can't break out of the literal.
function quote(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

type SpaceType = "personal" | "work";

/**
 * One row per space: its id and the type it was set up as. A space can have
 * more than one `space_setup` event (the action is retry-safe), so collapse
 * to the earliest — the first answer is the one the user gave at setup.
 */
async function fetchSetupPage(
  after?: string,
): Promise<Array<{ spaceId: string; spaceType: SpaceType }>> {
  const rows = await hogqlQuery(`
    SELECT
      $group_0 AS space_id,
      argMin(properties.space_type, timestamp) AS space_type
    FROM events
    WHERE event = 'space_setup'
      AND $group_0 != ''
      ${after ? `AND $group_0 > '${quote(after)}'` : ""}
    GROUP BY space_id
    ORDER BY space_id ASC
    LIMIT ${PAGE_SIZE}
  `);

  return rows.flatMap(([spaceId, spaceType]) =>
    typeof spaceId === "string" &&
    (spaceType === "personal" || spaceType === "work")
      ? [{ spaceId, spaceType }]
      : [],
  );
}

(async function backfillSpaceType() {
  const apply = process.argv.slice(2).includes("--apply");

  if (!process.env.DATABASE_URL || !API_KEY || !PROJECT_ID) {
    console.error(
      "❌ POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID and DATABASE_URL must be set — see packages/posthog/.env.sample",
    );
    process.exit(1);
  }

  console.info(
    apply
      ? "⚠️  APPLY mode — spaces with no stored type will be updated.\n"
      : "🔍 DRY RUN — nothing will be written. Pass --apply to write.\n",
  );

  const byType: Record<SpaceType, string[]> = {
    personal: [],
    work: [],
  };

  let after: string | undefined;

  console.info(`📸 Reading space_setup events (HogQL, ${PAGE_SIZE}/page)…`);

  for (;;) {
    const page = await fetchSetupPage(after);

    if (page.length === 0) {
      break;
    }

    for (const { spaceId, spaceType } of page) {
      byType[spaceType].push(spaceId);

      if (
        !apply &&
        byType.personal.length + byType.work.length <= SAMPLE_SIZE
      ) {
        console.info(`• ${spaceId} → ${spaceType}`);
      }
    }

    after = page[page.length - 1].spaceId;

    // A short page means the grouped result set is exhausted.
    if (page.length < PAGE_SIZE) {
      break;
    }
  }

  const found = byType.personal.length + byType.work.length;
  let updated = 0;

  try {
    for (const spaceType of ["personal", "work"] as const) {
      const ids = byType[spaceType];

      for (let i = 0; i < ids.length; i += UPDATE_BATCH_SIZE) {
        const batch = ids.slice(i, i + UPDATE_BATCH_SIZE);

        // `spaceType: null` in the filter is what keeps this idempotent and
        // non-destructive: a value set in the app always wins over history.
        const where = { id: { in: batch }, spaceType: null };

        if (apply) {
          const result = await prisma.space.updateMany({
            where,
            data: { spaceType },
          });
          updated += result.count;
        } else {
          updated += await prisma.space.count({ where });
        }
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.info(
    apply
      ? `\n📊 Done: ${found} space(s) resolved from PostHog, ${updated} updated (the rest already had a type or no longer exist).`
      : `\n🔍 Dry run complete: ${found} space(s) resolved from PostHog, ${updated} would be updated. Re-run with --apply to write.`,
  );
})().catch((error) => {
  console.error(`❌ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
