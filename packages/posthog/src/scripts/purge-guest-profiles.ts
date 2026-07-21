/**
 * Deletes guest person profiles (no email property) from PostHog.
 *
 * Guests are matched in two passes: email property not set, then email set to
 * an empty string. Selection uses the persons REST endpoint rather than HogQL
 * so the ids we fetch are exactly what bulk_delete expects. Each cycle
 * re-fetches the first page (no offset pagination — offsets drift as rows are
 * deleted) until the filter returns nothing.
 *
 * Events are preserved (delete_events: false) — only the person profiles are
 * removed; guest page views and events remain as historical data.
 *
 * DRY RUN by default — prints counts and a sample of matched profiles.
 * Pass --apply to delete, or --verify to run a single-profile canary that
 * proves deletion preserves events: it deletes ONE real guest profile with the
 * exact payload the purge uses, then asserts its events survived, the person
 * is gone, and no async event deletion was queued.
 *
 * Usage:
 *   pnpm --filter @rallly/posthog purge-guest-profiles
 *   pnpm --filter @rallly/posthog purge-guest-profiles -- --verify
 *   pnpm --filter @rallly/posthog purge-guest-profiles -- --apply
 *
 * Requires in packages/posthog/.env (see .env.sample):
 *   POSTHOG_PERSONAL_API_KEY  personal API key with query:read + person:write
 *   POSTHOG_PROJECT_ID
 *   POSTHOG_API_HOST          optional, defaults to https://us.posthog.com
 */

const API_HOST = process.env.POSTHOG_API_HOST ?? "https://us.posthog.com";
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;

const PAGE_SIZE = 1000;
const SAMPLE_SIZE = 50;
// CRUD endpoints are rate limited to 480/min org-wide
const DELETE_INTERVAL_MS = 800;
const MAX_RATE_LIMIT_RETRIES = 5;
// The persons list endpoint (ClickHouse) lags behind bulk_delete. When it hands
// back an empty page but the count still reports matches, back off and retry
// before treating the filter as exhausted.
const EMPTY_PAGE_BACKOFF_MS = 5000;
const MAX_EMPTY_PAGE_RETRIES = 12;

const GUEST_FILTERS = [
  {
    label: "email is not set",
    countQuery: "SELECT count() FROM persons WHERE isNull(properties.email)",
    properties: [
      {
        key: "email",
        operator: "is_not_set",
        value: "is_not_set",
        type: "person",
      },
    ],
  },
  {
    label: "email is empty string",
    countQuery: "SELECT count() FROM persons WHERE properties.email = ''",
    properties: [
      { key: "email", operator: "exact", value: "", type: "person" },
    ],
  },
];

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

async function hogqlCount(query: string): Promise<number> {
  const data = await apiRequest({
    path: `/api/projects/${PROJECT_ID}/query/`,
    method: "POST",
    body: { query: { kind: "HogQLQuery", query } },
  });
  return Number(data.results?.[0]?.[0] ?? 0);
}

async function fetchGuestPage({
  properties,
  limit,
}: {
  properties: unknown[];
  limit: number;
}): Promise<
  {
    id: string | number;
    uuid?: string;
    distinct_ids?: string[];
    properties?: Record<string, unknown>;
    created_at?: string;
  }[]
> {
  const params = new URLSearchParams({
    properties: JSON.stringify(properties),
    limit: String(limit),
  });
  const data = await apiRequest({
    path: `/api/projects/${PROJECT_ID}/persons/?${params}`,
  });
  return data.results ?? [];
}

async function preflight() {
  console.info("🔎 Pre-flight counts (HogQL):\n");

  const guests = await hogqlCount(
    "SELECT count() FROM persons WHERE isNull(properties.email) OR properties.email = ''",
  );
  const identifiedGuests = await hogqlCount(
    "SELECT count() FROM persons WHERE (isNull(properties.email) OR properties.email = '') AND is_identified",
  );
  const withEmail = await hogqlCount(
    "SELECT count() FROM persons WHERE isNotNull(properties.email) AND properties.email != ''",
  );

  console.info(`• Guest profiles (no email):        ${guests}`);
  console.info(`• …of which is_identified:          ${identifiedGuests}`);
  console.info(`• Profiles with an email:           ${withEmail}`);
  console.info(
    "\n⚠️  Sanity check: the with-email count should roughly match the registered user count in Postgres before you run --apply.",
  );

  return guests;
}

async function printSample() {
  const sample = await fetchGuestPage({
    properties: GUEST_FILTERS[0].properties,
    limit: SAMPLE_SIZE,
  });

  console.info(`\n📋 Sample of ${sample.length} matched profiles:\n`);
  for (const person of sample) {
    const email = person.properties?.email;
    console.info(
      `• ${person.id} created=${person.created_at ?? "?"} email=${JSON.stringify(email ?? null)} distinct_id=${person.distinct_ids?.[0] ?? "?"}`,
    );
  }
}

async function countEvents(distinctId: string) {
  return hogqlCount(
    `SELECT count() FROM events WHERE distinct_id = '${distinctId.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`,
  );
}

async function personExists(distinctId: string) {
  const params = new URLSearchParams({ distinct_id: distinctId });
  const data = await apiRequest({
    path: `/api/projects/${PROJECT_ID}/persons/?${params}`,
  });
  return (data.results ?? []).length > 0;
}

// Returns null if the endpoint is unavailable (older PostHog versions)
async function countQueuedEventDeletions(personUuid: string) {
  const params = new URLSearchParams({ person_uuid: personUuid });
  try {
    const data = await apiRequest({
      path: `/api/projects/${PROJECT_ID}/persons/deletion_status/?${params}`,
    });
    return (data.results ?? []).length as number;
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

async function verifyCanary() {
  console.info(
    "🧪 Canary check — deletes ONE real guest profile and asserts its events are preserved.\n",
  );

  const sample = await fetchGuestPage({
    properties: GUEST_FILTERS[0].properties,
    limit: SAMPLE_SIZE,
  });

  let canary:
    | {
        id: string | number;
        uuid: string;
        distinctId: string;
        eventCount: number;
      }
    | undefined;
  for (const person of sample) {
    const distinctId = person.distinct_ids?.[0];
    if (!distinctId) continue;
    const eventCount = await countEvents(distinctId);
    if (eventCount > 0) {
      canary = {
        id: person.id,
        uuid: person.uuid ?? String(person.id),
        distinctId,
        eventCount,
      };
      break;
    }
  }

  if (!canary) {
    throw new Error(
      "No guest profile with events found — the canary could not run, so deletion behavior is UNVERIFIED. Check the guest filter before running --apply.",
    );
  }

  console.info(
    `• Canary: person ${canary.id} distinct_id=${canary.distinctId} with ${canary.eventCount} event(s)`,
  );

  await apiRequest({
    path: `/api/projects/${PROJECT_ID}/persons/bulk_delete/`,
    method: "POST",
    body: { ids: [canary.id], delete_events: false },
  });
  console.info("• Profile deleted, checking outcomes…");
  await sleep(2000);

  const eventsAfter = await countEvents(canary.distinctId);
  const profileGone = !(await personExists(canary.distinctId));
  const queuedDeletions = await countQueuedEventDeletions(canary.uuid);

  const eventsPreserved = eventsAfter >= canary.eventCount;
  console.info(
    `${eventsPreserved ? "✅" : "❌"} Events preserved: ${canary.eventCount} before → ${eventsAfter} after`,
  );
  console.info(
    `${profileGone ? "✅" : "❌"} Person profile deleted: ${profileGone ? "no longer found" : "still exists"}`,
  );
  if (queuedDeletions === null) {
    console.info(
      "⚠️  deletion_status endpoint unavailable — skipping queued-deletion check",
    );
  } else {
    console.info(
      `${queuedDeletions === 0 ? "✅" : "❌"} No event deletion queued for the canary${queuedDeletions ? ` (found ${queuedDeletions} queued!)` : ""}`,
    );
  }

  if (!eventsPreserved || !profileGone || (queuedDeletions ?? 0) > 0) {
    throw new Error("Canary check FAILED — do not run --apply.");
  }
  console.info(
    "\n🧪 Canary check PASSED — bulk_delete removes the profile and leaves events intact.",
  );
}

async function purge({
  properties,
  countQuery,
  label,
}: {
  properties: unknown[];
  countQuery: string;
  label: string;
}) {
  console.info(`\n🗑️  Purging profiles where ${label}…`);
  let deleted = 0;
  let previousFirstId: string | number | undefined;
  let stuckCycles = 0;
  // The persons list endpoint reads from ClickHouse and is eventually
  // consistent: right after a bulk_delete it can briefly return a partial or
  // empty page while the deletes propagate. A single empty page is therefore
  // NOT proof the work is done — confirm against the authoritative count and
  // retry a few times before concluding the filter is exhausted.
  let emptyPages = 0;

  for (;;) {
    const page = await fetchGuestPage({ properties, limit: PAGE_SIZE });

    if (page.length === 0) {
      const remaining = await hogqlCount(countQuery);
      if (remaining === 0) {
        break;
      }
      emptyPages++;
      if (emptyPages >= MAX_EMPTY_PAGE_RETRIES) {
        throw new Error(
          `Persons list returned empty ${emptyPages} times but the count still reports ${remaining} matching profile(s). Read replica may be lagging — aborting so the run isn't silently left incomplete.`,
        );
      }
      console.info(
        `• Empty page but ${remaining} still match — waiting for read replica (retry ${emptyPages}/${MAX_EMPTY_PAGE_RETRIES})`,
      );
      await sleep(EMPTY_PAGE_BACKOFF_MS);
      continue;
    }

    emptyPages = 0;

    if (page[0].id === previousFirstId) {
      stuckCycles++;
      if (stuckCycles >= 3) {
        throw new Error(
          `Deletes are not taking effect — the same page keeps coming back (first id ${page[0].id}). Aborting.`,
        );
      }
    } else {
      stuckCycles = 0;
    }
    previousFirstId = page[0].id;

    await apiRequest({
      path: `/api/projects/${PROJECT_ID}/persons/bulk_delete/`,
      method: "POST",
      body: { ids: page.map((person) => person.id), delete_events: false },
    });

    deleted += page.length;
    console.info(`• Deleted ${page.length} (running total: ${deleted})`);
    await sleep(DELETE_INTERVAL_MS);
  }

  const remaining = await hogqlCount(countQuery);
  console.info(
    `✅ Done — ${deleted} profile(s) deleted where ${label}. Count now reports ${remaining} matching.`,
  );
  return deleted;
}

(async function purgeGuestProfiles() {
  if (!PROJECT_ID || !API_KEY) {
    console.error(
      "❌ POSTHOG_PROJECT_ID and POSTHOG_PERSONAL_API_KEY must be set — see packages/posthog/.env.sample",
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);
  if (args.includes("--verify")) {
    await verifyCanary();
    return;
  }

  const apply = args.includes("--apply");
  console.info(
    apply
      ? "⚠️  APPLY mode — matched guest profiles WILL be deleted.\n"
      : "🔍 DRY RUN — nothing will change. Pass --apply to delete.\n",
  );

  const guests = await preflight();

  if (!apply) {
    await printSample();
    console.info(
      "\n🔍 Dry run complete. Review the sample, then re-run with --apply to delete.",
    );
    return;
  }

  if (guests === 0) {
    console.info("\n✅ Nothing to purge.");
    return;
  }

  let total = 0;
  for (const filter of GUEST_FILTERS) {
    total += await purge(filter);
  }

  console.info(
    `\n📊 Done: ${total} guest profile(s) deleted. Their events were preserved.`,
  );
})().catch((error) => {
  console.error(`❌ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
