import { stripe } from "../lib/stripe";

/**
 * `createQuantityUpdatePortalConfiguration()` (apps/web/src/features/billing/utils.ts)
 * creates a brand-new billing portal configuration on every seat-update session
 * and never reuses it, so the Stripe account accumulates throwaway config objects.
 *
 * Stripe has no API to DELETE a portal configuration — the only cleanup available
 * is to deactivate it (`active: false`). This script does that for the stale
 * seat-update configs, identified by the headline they were created with so it
 * never touches a manually-configured or default portal.
 *
 * Note: this only stops the bleeding for what already exists. The real fix is to
 * cache/reuse a single configuration instead of creating one per session.
 *
 * DRY RUN by default — lists what would be deactivated and changes nothing.
 * Pass --apply to deactivate.
 *
 * Usage:
 *   pnpm --filter @rallly/billing cleanup-portal-configurations
 *   pnpm --filter @rallly/billing cleanup-portal-configurations -- --apply
 */

// Must match the headline set in createQuantityUpdatePortalConfiguration().
const SEAT_UPDATE_HEADLINE = "Update your seat allocation";

(async function cleanupPortalConfigurations() {
  const apply = process.argv.slice(2).includes("--apply");

  console.info(
    apply
      ? "⚠️  APPLY mode — matching configurations will be deactivated."
      : "🔍 DRY RUN — nothing will change. Pass --apply to deactivate.",
  );

  const stale: { id: string; created: Date }[] = [];
  let scanned = 0;

  for await (const config of stripe.billingPortal.configurations.list({
    limit: 100,
  })) {
    scanned++;

    if (config.business_profile?.headline !== SEAT_UPDATE_HEADLINE) continue;
    if (config.is_default) continue; // can't deactivate the default, and never should
    if (!config.active) continue; // already inactive

    stale.push({ id: config.id, created: new Date(config.created * 1000) });
  }

  console.info(
    `\nScanned ${scanned} configuration(s); ${stale.length} active seat-update config(s) to deactivate.\n`,
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
