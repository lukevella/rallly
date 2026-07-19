import type { Stripe } from "../lib/stripe";
import { createStripeClient } from "../lib/stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = createStripeClient({ secretKey });

/**
 * Remediation for seat changes made while the billing portal was configured with
 * `proration_behavior: "create_prorations"`. That setting defers proration line
 * items onto the next renewal invoice instead of charging immediately, so on a
 * yearly plan a customer who adds seats mid-cycle gets one large invoice a year
 * out covering both the deferred proration and the next year's renewal.
 *
 * This script finds the pending (uninvoiced) proration items still sitting on
 * subscriptions and invoices them now, collecting for current usage and shrinking
 * the upcoming renewal back to a normal amount.
 *
 * DRY RUN by default — prints the affected customers and amounts and changes
 * nothing. Pass --apply to actually create and collect the invoices.
 *
 * Usage:
 *   pnpm --filter @rallly/billing invoice-pending-prorations
 *   pnpm --filter @rallly/billing invoice-pending-prorations -- --customer=cus_123
 *   pnpm --filter @rallly/billing invoice-pending-prorations -- --interval=year
 *   pnpm --filter @rallly/billing invoice-pending-prorations -- --apply
 */

type Group = {
  subscriptionId: string;
  customerId: string;
  currency: string;
  amount: number; // minor units, summed across proration items
  itemCount: number;
};

type EnrichedGroup = Group & {
  email: string | null;
  interval: string;
  renewalDate: Date;
  collectionMethod: Stripe.Subscription.CollectionMethod;
  status: Stripe.Subscription.Status;
};

function parseArgs(argv: string[]) {
  let apply = false;
  let customer: string | undefined;
  let interval: string | undefined;

  for (const arg of argv) {
    if (arg === "--apply") apply = true;
    else if (arg.startsWith("--customer=")) customer = arg.slice(11);
    else if (arg.startsWith("--interval=")) interval = arg.slice(11);
  }

  return { apply, customer, interval };
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function idOf(value: string | { id: string } | null | undefined) {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

(async function invoicePendingProrations() {
  const args = parseArgs(process.argv.slice(2));

  console.info(
    args.apply
      ? "⚠️  APPLY mode — invoices will be created and charged."
      : "🔍 DRY RUN — nothing will be charged. Pass --apply to collect.",
  );

  // 1. Collect pending proration invoice items, grouped by subscription.
  const listParams: Stripe.InvoiceItemListParams = {
    pending: true,
    limit: 100,
  };
  if (args.customer) listParams.customer = args.customer;

  const groups = new Map<string, Group>();

  for await (const item of stripe.invoiceItems.list(listParams)) {
    if (!item.proration) continue;

    const subscriptionId = idOf(item.subscription);
    const customerId = idOf(item.customer);
    if (!subscriptionId || !customerId) continue;

    const group = groups.get(subscriptionId) ?? {
      subscriptionId,
      customerId,
      currency: item.currency,
      amount: 0,
      itemCount: 0,
    };
    group.amount += item.amount;
    group.itemCount += 1;
    groups.set(subscriptionId, group);
  }

  if (groups.size === 0) {
    console.info("✅ No pending proration invoice items found. Nothing to do.");
    return;
  }

  // 2. Enrich each subscription with renewal date, interval and customer email.
  const enriched: EnrichedGroup[] = [];

  for (const group of Array.from(groups.values())) {
    const subscription = await stripe.subscriptions.retrieve(
      group.subscriptionId,
      { expand: ["customer"] },
    );

    if (
      subscription.status === "canceled" ||
      subscription.status === "incomplete_expired"
    ) {
      continue; // nothing to collect on a dead subscription
    }

    const interval =
      subscription.items.data[0]?.price.recurring?.interval ?? "unknown";
    if (args.interval && interval !== args.interval) continue;

    const customer = subscription.customer;
    const email =
      typeof customer !== "string" && !customer.deleted ? customer.email : null;

    enriched.push({
      ...group,
      email,
      interval,
      renewalDate: new Date(subscription.current_period_end * 1000),
      collectionMethod: subscription.collection_method,
      status: subscription.status,
    });
  }

  if (enriched.length === 0) {
    console.info(
      "✅ No matching subscriptions after filtering. Nothing to do.",
    );
    return;
  }

  // 3. Report.
  console.info(
    `\nFound deferred prorations on ${enriched.length} subscription(s):\n`,
  );

  const totals = new Map<string, number>();
  for (const g of enriched) {
    console.info(
      `• ${g.email ?? g.customerId} (${g.customerId})\n` +
        `    sub=${g.subscriptionId} ${g.interval}ly status=${g.status} collect=${g.collectionMethod}\n` +
        `    renews ${g.renewalDate.toISOString().slice(0, 10)} — deferred ${formatMoney(g.amount, g.currency)} across ${g.itemCount} item(s)`,
    );
    totals.set(g.currency, (totals.get(g.currency) ?? 0) + g.amount);
  }

  console.info("\nTotal to be collected now:");
  for (const [currency, amount] of Array.from(totals.entries())) {
    console.info(`  ${formatMoney(amount, currency)}`);
  }

  if (!args.apply) {
    console.info(
      "\n🔍 Dry run complete. Re-run with --apply to create and charge these invoices.",
    );
    return;
  }

  // 4. Apply — one invoice per subscription, sweeping its pending proration items.
  console.info("\n⚠️  Applying...\n");
  let collected = 0;
  let failed = 0;

  for (const g of enriched) {
    try {
      const draft = await stripe.invoices.create({
        customer: g.customerId,
        subscription: g.subscriptionId,
        collection_method: g.collectionMethod,
        description:
          "Charge for seats added during your current billing period.",
        auto_advance: false,
        // Pending proration items for this subscription are pulled in.
        pending_invoice_items_behavior: "include",
      });

      const finalized = await stripe.invoices.finalizeInvoice(draft.id);

      if (finalized.collection_method === "send_invoice") {
        await stripe.invoices.sendInvoice(finalized.id);
        console.info(
          `📧 ${g.email ?? g.customerId}: invoice ${finalized.id} sent (${formatMoney(finalized.amount_due, finalized.currency)})`,
        );
      } else if (finalized.status !== "paid") {
        const paid = await stripe.invoices.pay(finalized.id);
        console.info(
          `✅ ${g.email ?? g.customerId}: ${paid.status} ${formatMoney(paid.amount_paid, paid.currency)}`,
        );
      } else {
        console.info(
          `✅ ${g.email ?? g.customerId}: already ${finalized.status}`,
        );
      }
      collected++;
    } catch (error) {
      console.error(
        `❌ ${g.email ?? g.customerId} (sub ${g.subscriptionId}): ${error instanceof Error ? error.message : error}`,
      );
      failed++;
    }
  }

  console.info(`\n📊 Done: ${collected} processed, ${failed} failed.`);
})();
