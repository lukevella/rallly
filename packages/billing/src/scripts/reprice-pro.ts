import type { Stripe } from "../lib/stripe";
import { createStripeClient, PRO_LOOKUP_KEYS } from "../lib/stripe";

/**
 * Moves the `pro-monthly` / `pro-yearly` lookup keys onto new prices and
 * re-keys the previous prices as early supporter prices. Existing
 * subscriptions keep their price object, so they become early supporters by
 * the app's "not a current price" rule the moment the keys move.
 *
 * DRY RUN by default. Pass --apply to write.
 *
 * Usage:
 *   pnpm --filter @rallly/billing reprice-pro -- --monthly usd=1000,eur=900,gbp=800 --yearly usd=8400,eur=7600,gbp=6700
 *   pnpm --filter @rallly/billing reprice-pro -- --monthly ... --yearly ... --apply
 */

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = createStripeClient({ secretKey });

function parseAmounts(flag: string) {
  const args = process.argv.slice(2);
  const index = args.indexOf(flag);
  const raw = index === -1 ? undefined : args[index + 1];
  if (!raw) {
    throw new Error(`Missing ${flag} usd=<minor>,eur=<minor>,gbp=<minor>`);
  }
  const amounts: Record<string, number> = {};
  for (const pair of raw.split(",")) {
    const [currency, amount] = pair.split("=");
    const value = Number.parseInt(amount ?? "", 10);
    if (!currency || Number.isNaN(value) || value <= 0) {
      throw new Error(`Invalid amount in ${flag}: ${pair}`);
    }
    amounts[currency.toLowerCase()] = value;
  }
  if (!amounts.usd) {
    throw new Error(`${flag} must include usd`);
  }
  return amounts;
}

async function findByLookupKey(lookupKey: string) {
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    expand: ["data.currency_options"],
  });
  return prices.data[0];
}

function describe(price: Stripe.Price) {
  const options = Object.entries(price.currency_options ?? {})
    .map(([currency, option]) => `${currency}=${option.unit_amount}`)
    .join(",");
  return `${price.id} (${price.currency}=${price.unit_amount}${options ? `, ${options}` : ""})`;
}

(async function repricePro() {
  const apply = process.argv.slice(2).includes("--apply");
  const monthlyAmounts = parseAmounts("--monthly");
  const yearlyAmounts = parseAmounts("--yearly");

  console.info(
    apply
      ? "⚠️  APPLY mode — prices will be created and lookup keys moved."
      : "🔍 DRY RUN — nothing will change. Pass --apply to write.",
  );

  const [monthly, yearly, existingEsMonthly, existingEsYearly] =
    await Promise.all([
      findByLookupKey(PRO_LOOKUP_KEYS.monthly),
      findByLookupKey(PRO_LOOKUP_KEYS.yearly),
      findByLookupKey(PRO_LOOKUP_KEYS.earlySupporterMonthly),
      findByLookupKey(PRO_LOOKUP_KEYS.earlySupporterYearly),
    ]);

  if (existingEsMonthly || existingEsYearly) {
    console.info(
      "✅ Early supporter prices already exist; nothing to do.",
      existingEsMonthly?.id,
      existingEsYearly?.id,
    );
    return;
  }

  if (!monthly || !yearly) {
    throw new Error("Current pro-monthly / pro-yearly prices not found");
  }

  if (monthly.product !== yearly.product) {
    throw new Error("Monthly and yearly prices are on different products");
  }

  const productId = monthly.product as string;

  console.info(`Current monthly: ${describe(monthly)}`);
  console.info(`Current yearly:  ${describe(yearly)}`);
  console.info(`New monthly: ${JSON.stringify(monthlyAmounts)}`);
  console.info(`New yearly:  ${JSON.stringify(yearlyAmounts)}`);

  if (!apply) {
    console.info("\n🔍 Dry run complete. Re-run with --apply to write.");
    return;
  }

  const toCreateParams = (
    lookupKey: string,
    interval: "month" | "year",
    amounts: Record<string, number>,
  ): Stripe.PriceCreateParams => {
    const { usd, ...others } = amounts;
    return {
      product: productId,
      currency: "usd",
      unit_amount: usd,
      recurring: { interval },
      lookup_key: lookupKey,
      transfer_lookup_key: true,
      currency_options: Object.fromEntries(
        Object.entries(others).map(([currency, amount]) => [
          currency,
          { unit_amount: amount },
        ]),
      ),
    };
  };

  // Create-then-rekey, one interval at a time (monthly fully done before
  // yearly starts): if this crashes partway through, at most one early
  // supporter key is left dangling, and the "already exists, exit" guard
  // above stops a re-run from creating a duplicate new price for the
  // interval that already finished.
  const newMonthly = await stripe.prices.create(
    toCreateParams(PRO_LOOKUP_KEYS.monthly, "month", monthlyAmounts),
    { idempotencyKey: `reprice-pro-monthly-${monthly.id}` },
  );

  // transfer_lookup_key cleared the key on the old price; give it the early
  // supporter key so the app can offer it to legacy subscribers.
  await stripe.prices.update(monthly.id, {
    lookup_key: PRO_LOOKUP_KEYS.earlySupporterMonthly,
  });

  const newYearly = await stripe.prices.create(
    toCreateParams(PRO_LOOKUP_KEYS.yearly, "year", yearlyAmounts),
    { idempotencyKey: `reprice-pro-yearly-${yearly.id}` },
  );

  await stripe.prices.update(yearly.id, {
    lookup_key: PRO_LOOKUP_KEYS.earlySupporterYearly,
  });

  console.info("\n📊 Done.");
  console.info(`${PRO_LOOKUP_KEYS.monthly}: ${newMonthly.id}`);
  console.info(`${PRO_LOOKUP_KEYS.yearly}: ${newYearly.id}`);
  console.info(`${PRO_LOOKUP_KEYS.earlySupporterMonthly}: ${monthly.id}`);
  console.info(`${PRO_LOOKUP_KEYS.earlySupporterYearly}: ${yearly.id}`);
  console.info(
    "\nThe app caches prices for one hour. Redeploy or wait before verifying.",
  );
})();
