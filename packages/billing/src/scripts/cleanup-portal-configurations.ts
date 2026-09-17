import {
  ACCOUNT_PORTAL_CONFIG_VERSION,
  PORTAL_CONFIG_PURPOSE,
  portalConfigCoversPair,
} from "../lib/portal";
import { createStripeClient, getProPricing } from "../lib/stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = createStripeClient({ secretKey });

/**
 * Portal configurations are created on demand and identified by metadata:
 * "flows" configurations carry the sorted pair of price ids they allow,
 * "account" carries a version. Stripe has no API to DELETE a portal
 * configuration — the only cleanup available is to deactivate it
 * (`active: false`).
 *
 * This deactivates our stale configurations: "flows" configs whose price
 * pair is no longer a live price set (current or early supporter), "account"
 * configs whose version isn't current, and any leftover pre-2026-09
 * "seat_update" configs. The live configurations the app is actively using
 * are left untouched, as is the default configuration.
 *
 * A 24h age guard additionally skips very recently created configs, eliminating
 * any race with an in-flight portal session.
 *
 * DRY RUN by default — lists what would be deactivated and changes nothing.
 * Pass --apply to deactivate.
 *
 * Usage:
 *   pnpm --filter @rallly/billing cleanup-portal-configurations
 *   pnpm --filter @rallly/billing cleanup-portal-configurations -- --apply
 */

const MIN_AGE_MS = 24 * 60 * 60 * 1000;

(async function cleanupPortalConfigurations() {
  const apply = process.argv.slice(2).includes("--apply");
  const cutoff = Date.now() - MIN_AGE_MS;

  console.info(
    apply
      ? "⚠️  APPLY mode — matching configurations will be deactivated."
      : "🔍 DRY RUN — nothing will change. Pass --apply to deactivate.",
  );

  const pricing = await getProPricing({ stripe });
  const livePairs = [[pricing.monthly.id, pricing.yearly.id]];
  if (pricing.earlySupporter) {
    livePairs.push([
      pricing.earlySupporter.monthly.id,
      pricing.earlySupporter.yearly.id,
    ]);
  }

  const isLive = (metadata: Record<string, string>) => {
    if (metadata.purpose === PORTAL_CONFIG_PURPOSE.flows) {
      const key = metadata.prices ?? "";
      // A flows config may also carry a subscriber's own legacy tail price
      // alongside a live pair, so "live" means it covers at least one pair.
      return livePairs.some((pairIds) =>
        portalConfigCoversPair({ key, pairIds }),
      );
    }
    if (metadata.purpose === PORTAL_CONFIG_PURPOSE.account) {
      return metadata.version === ACCOUNT_PORTAL_CONFIG_VERSION;
    }
    return false;
  };

  // "seat_update" is the pre-2026-09 purpose; every config carrying it is stale.
  const ours = (metadata: Record<string, string>) =>
    metadata.purpose === PORTAL_CONFIG_PURPOSE.flows ||
    metadata.purpose === PORTAL_CONFIG_PURPOSE.account ||
    metadata.purpose === "seat_update";

  const stale: { id: string; created: Date }[] = [];
  let scanned = 0;
  let skippedRecent = 0;

  for await (const config of stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  })) {
    scanned++;
    const metadata = config.metadata ?? {};
    if (!ours(metadata)) continue; // not one of ours
    if (config.is_default) continue; // never touch the default
    if (isLive(metadata)) continue;
    if (config.created * 1000 > cutoff) {
      skippedRecent++;
      continue; // created within the age guard window
    }

    stale.push({ id: config.id, created: new Date(config.created * 1000) });
  }

  console.info(
    `\nScanned ${scanned} active configuration(s); ${stale.length} stale config(s) to deactivate` +
      (skippedRecent ? ` (${skippedRecent} skipped by 24h age guard).` : "."),
  );

  if (stale.length === 0) {
    console.info("✅ Nothing to clean up.");
    return;
  }

  for (const config of stale) {
    console.info(
      `• ${config.id} (created ${config.created.toISOString().slice(0, 10)})`,
    );
  }

  if (!apply) {
    console.info(
      "\n🔍 Dry run complete. Re-run with --apply to deactivate these configurations.",
    );
    return;
  }

  console.info("\n⚠️  Deactivating...\n");
  let deactivated = 0;
  let failed = 0;

  for (const config of stale) {
    try {
      await stripe.billingPortal.configurations.update(config.id, {
        active: false,
      });
      deactivated++;
    } catch (error) {
      console.error(
        `❌ ${config.id}: ${error instanceof Error ? error.message : error}`,
      );
      failed++;
    }
  }

  console.info(`\n📊 Done: ${deactivated} deactivated, ${failed} failed.`);
})();
