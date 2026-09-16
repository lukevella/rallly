import type { Stripe } from "../lib/stripe";
import { createStripeClient, PRO_LOOKUP_KEYS } from "../lib/stripe";

/**
 * Moves the `pro-monthly` / `pro-yearly` lookup keys onto new prices and
 * re-keys the previous prices as early supporter prices. Existing
 * subscriptions keep their price object, so they become early supporters by
 * the app's "not a current price" rule the moment the keys move.
 *
 * Each interval is reconciled independently from whatever state Stripe is in,
 * so a run that stops partway can be repeated until both intervals report
 * done. The new price carries `metadata.replaces = <old price id>` so a
 * half moved interval can still be finished.
 *
 * DRY RUN by default. Pass --apply to write.
 *
 * Usage:
 *   pnpm --filter @rallly/billing reprice-pro -- --monthly usd=1000,eur=900,gbp=800 --yearly usd=7200,eur=6500,gbp=5800
 *   pnpm --filter @rallly/billing reprice-pro -- --monthly ... --yearly ... --apply
 */

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = createStripeClient({ secretKey });

const REPLACES_METADATA_KEY = "replaces";

type Interval = "month" | "year";

type IntervalSpec = {
  interval: Interval;
  currentKey: string;
  earlySupporterKey: string;
  amounts: Record<string, number>;
};

function parseAmounts(flag: string) {
  const args = process.argv.slice(2);
  const index = args.indexOf(flag);
  const raw = index === -1 ? undefined : args[index + 1];
  if (!raw) {
    throw new Error(`Missing ${flag} usd=<minor>,eur=<minor>,gbp=<minor>`);
  }
  const amounts: Record<string, number> = {};
  for (const pair of raw.split(",")) {
    const parts = pair.split("=");
    const currency = parts[0]?.trim().toLowerCase();
    const amount = parts[1]?.trim();
    const value = Number(amount);
    if (
      parts.length !== 2 ||
      !currency ||
      !/^[a-z]{3}$/.test(currency) ||
      !amount ||
      !/^\d+$/.test(amount) ||
      !Number.isSafeInteger(value) ||
      value <= 0 ||
      Object.hasOwn(amounts, currency)
    ) {
      throw new Error(`Invalid amount in ${flag}: ${pair}`);
    }
    amounts[currency] = value;
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

// The replacement price created earlier for `oldPrice`, located by metadata
// rather than lookup key because a crash between "create" and "re-key" leaves
// it without one.
async function findReplacementFor(oldPrice: Stripe.Price, interval: Interval) {
  const prices = stripe.prices.list({
    product: oldPrice.product as string,
    active: true,
    recurring: { interval },
    limit: 100,
  });
  for await (const price of prices) {
    if (price.metadata?.[REPLACES_METADATA_KEY] === oldPrice.id) {
      return price;
    }
  }
  return undefined;
}

function describe(price: Stripe.Price) {
  const options = Object.entries(price.currency_options ?? {})
    .map(([currency, option]) => `${currency}=${option.unit_amount}`)
    .join(",");
  return `${price.id} (${price.currency}=${price.unit_amount}${options ? `, ${options}` : ""})`;
}

function toCreateParams(
  oldPrice: Stripe.Price,
  spec: IntervalSpec,
): Stripe.PriceCreateParams {
  const { usd, ...others } = spec.amounts;
  return {
    product: oldPrice.product as string,
    currency: "usd",
    unit_amount: usd,
    recurring: { interval: spec.interval },
    metadata: { [REPLACES_METADATA_KEY]: oldPrice.id },
    currency_options: Object.fromEntries(
      Object.entries(others).map(([currency, amount]) => [
        currency,
        { unit_amount: amount },
      ]),
    ),
  };
}

/**
 * Brings one interval to the finished state: the new price holds the current
 * key, the old price holds the early supporter key. Steps, each of which can
 * be the point a previous run stopped at:
 *
 *   1. create the new price (no lookup key yet; idempotent on the old price id)
 *   2. move the old price onto the early supporter key
 *   3. move the new price onto the current key
 */
async function reconcileInterval(spec: IntervalSpec, apply: boolean) {
  const label = spec.interval === "month" ? "monthly" : "yearly";
  const [current, earlySupporter] = await Promise.all([
    findByLookupKey(spec.currentKey),
    findByLookupKey(spec.earlySupporterKey),
  ]);

  if (current && earlySupporter) {
    console.info(
      `✅ ${label}: done. ${spec.currentKey}=${current.id} ${spec.earlySupporterKey}=${earlySupporter.id}`,
    );
    return;
  }

  if (!current && !earlySupporter) {
    throw new Error(`${label}: neither lookup key exists; nothing to move`);
  }

  if (earlySupporter && !current) {
    // Stopped between steps 2 and 3.
    const replacement = await findReplacementFor(earlySupporter, spec.interval);
    if (!replacement) {
      throw new Error(
        `${label}: ${spec.earlySupporterKey} is set on ${earlySupporter.id} but no replacement price carries metadata.${REPLACES_METADATA_KEY}=${earlySupporter.id}`,
      );
    }
    console.info(
      `↻ ${label}: resuming. Assign ${spec.currentKey} to ${describe(replacement)}`,
    );
    if (apply) {
      await stripe.prices.update(replacement.id, {
        lookup_key: spec.currentKey,
      });
      console.info(`✅ ${label}: done.`);
    }
    return;
  }

  // current && !earlySupporter: not started, or stopped between steps 1 and 2.
  const oldPrice = current as Stripe.Price;
  if (oldPrice.metadata?.[REPLACES_METADATA_KEY]) {
    throw new Error(
      `${label}: ${spec.currentKey} is already on a replacement price (${oldPrice.id}) but ${spec.earlySupporterKey} is missing; fix the keys in Stripe by hand`,
    );
  }

  console.info(`Current ${label}: ${describe(oldPrice)}`);
  console.info(`New ${label}: ${JSON.stringify(spec.amounts)}`);

  if (!apply) {
    return;
  }

  // Idempotent on the old price id, so a re-run after a crash between steps 1
  // and 2 gets the same price back instead of a second one.
  const replacement = await stripe.prices.create(
    toCreateParams(oldPrice, spec),
    { idempotencyKey: `reprice-pro-${label}-${oldPrice.id}` },
  );
  await stripe.prices.update(oldPrice.id, {
    lookup_key: spec.earlySupporterKey,
  });
  await stripe.prices.update(replacement.id, {
    lookup_key: spec.currentKey,
  });
  console.info(
    `✅ ${label}: done. ${spec.currentKey}=${replacement.id} ${spec.earlySupporterKey}=${oldPrice.id}`,
  );
}

(async function repricePro() {
  const apply = process.argv.slice(2).includes("--apply");
  const specs: IntervalSpec[] = [
    {
      interval: "month",
      currentKey: PRO_LOOKUP_KEYS.monthly,
      earlySupporterKey: PRO_LOOKUP_KEYS.earlySupporterMonthly,
      amounts: parseAmounts("--monthly"),
    },
    {
      interval: "year",
      currentKey: PRO_LOOKUP_KEYS.yearly,
      earlySupporterKey: PRO_LOOKUP_KEYS.earlySupporterYearly,
      amounts: parseAmounts("--yearly"),
    },
  ];

  console.info(
    apply
      ? "⚠️  APPLY mode — prices will be created and lookup keys moved."
      : "🔍 DRY RUN — nothing will change. Pass --apply to write.",
  );

  for (const spec of specs) {
    await reconcileInterval(spec, apply);
  }

  console.info(
    apply
      ? "\nThe app caches prices for one hour. Redeploy or wait before verifying."
      : "\n🔍 Dry run complete. Re-run with --apply to write.",
  );
})();
