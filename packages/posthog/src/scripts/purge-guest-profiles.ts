/**
 * Deletes guest person profiles (no email property) from PostHog.
 *
 * Two-phase design so the delete loop never paginates a table it is mutating:
 *
 *   1. SNAPSHOT — page through HogQL once, up front, collecting every guest
 *      person id into memory (keyset pagination on `id`; OFFSET is rejected for
 *      personal API keys). HogQL `persons.id` is the person UUID, which is
 *      exactly what bulk_delete expects.
 *   2. DRAIN — delete the snapshot ids in fixed batches. Deleting an id that is
 *      already gone is a no-op, so the eventually-consistent persons replica
 *      lagging behind bulk_delete no longer matters: we drain a frozen list, we
 *      never re-read the mutating table for the next cursor. This removes the
 *      empty-page / read-replica-lag failure mode of the old first-page-refetch
 *      loop, which stalled at ~1.2M rows because the list replica fell more than
 *      a minute behind under sustained delete load.
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

const SAMPLE_SIZE = 50;
// HogQL rows fetched per keyset page while building the id snapshot.
const SNAPSHOT_PAGE_SIZE = 10000;
// bulk_delete accepts at most 1000 ids per call (PostHog validates this).
const DELETE_BATCH_SIZE = 1000;
// CRUD endpoints are rate limited to 480/min org-wide
const DELETE_INTERVAL_MS = 800;
const MAX_RATE_LIMIT_RETRIES = 5;

// Guests are persons with no usable email. `email = ''` matched 0 rows in
// production, but keep it in the predicate for correctness.
const GUEST_PREDICATE = "isNull(properties.email) OR properties.email = ''";
const GUEST_COUNT_QUERY = `SELECT count() FROM persons WHERE ${GUEST_PREDICATE}`;

// Persons REST filter for the sample/canary reads (that endpoint uses property
// filters, not HogQL). Matches the "email not set" pass of the predicate.
const GUEST_REST_PROPERTIES = [
  { key: "email", operator: "is_not_set", value: "is_not_set", type: "person" },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Thousands separators for log readability (avoids Intl date-format lint rule).
function fmt(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

async function hogqlCount(query: string): Promise<number> {
  const results = await hogqlQuery(query);
  return Number(results?.[0]?.[0] ?? 0);
}

// Escape a UUID for safe interpolation into a HogQL string literal. The values
// come from PostHog itself and are always well-formed UUIDs, but keep the escape
// so a malformed value can't break out of the toUUID('…') literal.
function quoteUuid(id: string): string {
  return id.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

// Page through the guest filter once, up front, collecting every id into memory.
// Keyset pagination on `id` (OFFSET is rejected for personal API keys). Returns
// the full frozen list the drain loop consumes.
async function snapshotGuestIds(): Promise<string[]> {
  console.info(
    `\n📸 Snapshotting guest person ids (HogQL, ${fmt(SNAPSHOT_PAGE_SIZE)}/page)…`,
  );
  const ids: string[] = [];
  let cursor: string | undefined;

  for (;;) {
    const where = cursor
      ? `(${GUEST_PREDICATE}) AND id > toUUID('${quoteUuid(cursor)}')`
      : GUEST_PREDICATE;
    const query = `SELECT id FROM persons WHERE ${where} ORDER BY id LIMIT ${SNAPSHOT_PAGE_SIZE}`;

    const rows = await hogqlQuery(query);
    if (rows.length === 0) break;

    for (const row of rows) {
      ids.push(String(row[0]));
    }
    cursor = String(rows[rows.length - 1][0]);
    console.info(`• Snapshotted ${fmt(ids.length)} id(s) so far…`);

    if (rows.length < SNAPSHOT_PAGE_SIZE) break;
  }

  console.info(`📸 Snapshot complete — ${fmt(ids.length)} guest id(s).`);
  return ids;
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
    properties: GUEST_REST_PROPERTIES,
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
    properties: GUEST_REST_PROPERTIES,
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

// Drains the frozen id snapshot in fixed batches. Deleting an already-deleted id
// is a no-op, so replica lag never stalls the loop and offsets never drift.
async function purge(ids: string[]) {
  console.info(
    `\n🗑️  Deleting ${fmt(ids.length)} guest profile(s) in batches of ${DELETE_BATCH_SIZE}…`,
  );
  let deleted = 0;

  for (let i = 0; i < ids.length; i += DELETE_BATCH_SIZE) {
    const batch = ids.slice(i, i + DELETE_BATCH_SIZE);

    await apiRequest({
      path: `/api/projects/${PROJECT_ID}/persons/bulk_delete/`,
      method: "POST",
      body: { ids: batch, delete_events: false },
    });

    deleted += batch.length;
    console.info(
      `• Deleted ${batch.length} (running total: ${fmt(deleted)}/${fmt(ids.length)})`,
    );
    await sleep(DELETE_INTERVAL_MS);
  }

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

  const ids = await snapshotGuestIds();
  const deleted = await purge(ids);

  const remaining = await hogqlCount(GUEST_COUNT_QUERY);
  console.info(
    `\n📊 Done: ${fmt(deleted)} guest profile(s) deleted. Their events were preserved. Count now reports ${fmt(remaining)} matching.`,
  );
  if (remaining > 0) {
    console.info(
      "ℹ️  A non-zero remaining count right after the run is usually replica lag or profiles created since the snapshot — re-run to sweep any stragglers.",
    );
  }
})().catch((error) => {
  console.error(`❌ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
