import {
  SEAT_UPDATE_PORTAL_HEADLINE,
  SEAT_UPDATE_PORTAL_VERSION,
} from "../lib/portal";
import { createStripeClient } from "../lib/stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = createStripeClient({ secretKey });

/**
 * Before the seat-update flow reused a single billing portal configuration, it
 * created a new one on every session, so the Stripe account accumulated throwaway
 * config objects. Stripe has no API to DELETE a portal configuration — the only
 * cleanup available is to deactivate it (`active: false`).
 *
 * This deactivates the stale seat-update configurations: those carrying our
 * headline but NOT the current version (i.e. old unversioned ones, or any
 * previous version after a version bump). The current-version configuration the
 * app is actively using is left untouched, as is the default configuration.
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

  const stale: { id: string; created: Date }[] = [];
  let scanned = 0;
  let skippedRecent = 0;

  for await (const config of stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  })) {
    scanned++;

    if (config.business_profile?.headline !== SEAT_UPDATE_PORTAL_HEADLINE) {
      continue; // not one of ours
    }
    if (config.is_default) continue; // never touch the default
    if (config.metadata?.version === SEAT_UPDATE_PORTAL_VERSION) {
      continue; // current version — the live config, leave it
    }
    if (config.created * 1000 > cutoff) {
      skippedRecent++;
      continue; // created within the age guard window
    }

    stale.push({ id: config.id, created: new Date(config.created * 1000) });
  }

  console.info(
    `\nScanned ${scanned} active configuration(s); ${stale.length} stale seat-update config(s) to deactivate` +
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
