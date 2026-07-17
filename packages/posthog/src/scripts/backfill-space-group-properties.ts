import { prisma } from "@rallly/database";
import { PostHog } from "posthog-node";

/**
 * Backfills snake_case space group properties in PostHog.
 *
 * Space group properties were renamed from camelCase to snake_case
 * (memberCount → member_count, seatCount → seat_count) and
 * custom_branding_enabled was added. New writes use the new names, but
 * existing space groups only get them when they happen to be written again.
 * This sends a groupIdentify for every space with current values computed
 * from the database, and blanks the old camelCase keys (groups don't
 * support $unset, so they're set to null).
 *
 * Group properties are current-state, so the backfill is fully retroactive
 * for insights that break down by group property.
 *
 * DRY RUN by default — prints totals and a sample of computed properties.
 * Pass --apply to send.
 *
 * Usage:
 *   pnpm --filter @rallly/posthog backfill-space-group-properties
 *   pnpm --filter @rallly/posthog backfill-space-group-properties -- --apply
 *
 * Requires in packages/posthog/.env (see .env.sample):
 *   NEXT_PUBLIC_POSTHOG_API_KEY   project API key (ingestion)
 *   NEXT_PUBLIC_POSTHOG_API_HOST  optional
 *   DATABASE_URL
 */

const API_KEY = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
const API_HOST = process.env.NEXT_PUBLIC_POSTHOG_API_HOST;

const PAGE_SIZE = 500;
const SAMPLE_SIZE = 10;
// Without an explicit distinctId, groupIdentify defaults to $space_<groupKey>,
// which creates a dummy person profile PER GROUP (PostHog/posthog#7921). A
// single shared id caps the junk at one person for the whole run.
const BACKFILL_DISTINCT_ID = "space_group_properties_backfill";
// Matches DEFAULT_SEAT_LIMIT in apps/web — spaces without an active
// subscription have a single seat
const DEFAULT_SEAT_COUNT = 1;

async function fetchSpacePage(cursor?: string) {
  return prisma.space.findMany({
    take: PAGE_SIZE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      tier: true,
      showBranding: true,
      _count: { select: { members: true } },
      subscriptions: {
        where: { active: true },
        select: { quantity: true },
        take: 1,
      },
    },
  });
}

function toGroupProperties(
  space: Awaited<ReturnType<typeof fetchSpacePage>>[number],
) {
  return {
    name: space.name,
    tier: space.tier,
    member_count: space._count.members,
    seat_count: space.subscriptions[0]?.quantity ?? DEFAULT_SEAT_COUNT,
    custom_branding_enabled: space.showBranding,
    // blank the old camelCase keys
    memberCount: null,
    seatCount: null,
  };
}

(async function backfillSpaceGroupProperties() {
  const apply = process.argv.slice(2).includes("--apply");

  if (!process.env.DATABASE_URL || (apply && !API_KEY)) {
    console.error(
      apply
        ? "❌ NEXT_PUBLIC_POSTHOG_API_KEY and DATABASE_URL must be set — see packages/posthog/.env.sample"
        : "❌ DATABASE_URL must be set — see packages/posthog/.env.sample",
    );
    process.exit(1);
  }

  console.info(
    apply
      ? "⚠️  APPLY mode — group properties will be sent to PostHog.\n"
      : "🔍 DRY RUN — nothing will be sent. Pass --apply to send.\n",
  );

  const posthog =
    apply && API_KEY
      ? new PostHog(API_KEY, { host: API_HOST, flushAt: 100 })
      : undefined;

  let processed = 0;
  let cursor: string | undefined;

  try {
    for (;;) {
      const page = await fetchSpacePage(cursor);
      if (page.length === 0) {
        break;
      }
      cursor = page[page.length - 1].id;

      for (const space of page) {
        const properties = toGroupProperties(space);

        if (!apply && processed < SAMPLE_SIZE) {
          console.info(`• ${space.id} ${JSON.stringify(properties)}`);
        }

        posthog?.groupIdentify({
          groupType: "space",
          groupKey: space.id,
          properties,
          distinctId: BACKFILL_DISTINCT_ID,
        });
        processed++;
      }

      if (apply) {
        console.info(`• Sent ${processed} so far…`);
      }
    }
  } finally {
    // shutdown flushes the queued events — without this the tail of the
    // batch is dropped when the process exits, including on errors
    await posthog?.shutdown();
    await prisma.$disconnect();
  }

  console.info(
    apply
      ? `\n📊 Done: group properties sent for ${processed} space(s).`
      : `\n🔍 Dry run complete: ${processed} space(s) would be updated (${SAMPLE_SIZE} sampled above). Re-run with --apply to send.`,
  );
})().catch((error) => {
  console.error(`❌ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
