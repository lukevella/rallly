import type { Stripe } from "../lib/stripe";
import {
  ADDON_METADATA_KEY,
  API_ADDON,
  apiPollAddonLookupKey,
  apiPollAddonPriceParams,
  createStripeClient,
  findApiPollAddonMetadataUpdates,
  findApiPollAddonPriceMismatches,
  findApiPollAddonProductTagProblem,
  findSharedProductProblem,
  PRO_LOOKUP_KEYS,
} from "../lib/stripe";
import { API_POLL_TIERS } from "../pricing";

/**
 * Creates the API add-on: one product and eight recurring prices (four
 * tiers, monthly and yearly) keyed `api-<tier>-<interval>`. Amounts come
 * from `apiPollAddonAmounts` in pricing.ts. Tax behavior is copied from the
 * `pro-monthly` price.
 *
 * Safe to repeat. The product is found by `metadata.addon` (via the products
 * of existing add-on prices, then a product list scan) before creating one.
 * A lookup key that already exists is compared with the expected price.
 * Missing or wrong metadata keys are set in place, since metadata does not
 * affect billing; keys are never removed. Any other difference is reported
 * as a mismatch, and the price is never moved, repriced or archived.
 *
 * Prices use fixed idempotency keys, so Stripe rejects a re-run with changed
 * params within 24 hours.
 *
 * DRY RUN by default. Pass --apply to write.
 *
 * Usage:
 *   pnpm --filter @rallly/billing create-api-poll-addon-prices
 *   pnpm --filter @rallly/billing create-api-poll-addon-prices -- --apply
 */

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = createStripeClient({ secretKey });

const PRODUCT_NAME = "Rallly API Add-on";
const PRODUCT_IDEMPOTENCY_KEY = "create-api-addon-product";

// Product search is eventually consistent, so a quick repeat run could miss a
// product it just created. Listing is consistent.
async function findProduct(existing: Stripe.Price[]) {
  const fromPrice = existing[0]?.product;
  if (fromPrice) {
    const shared = findSharedProductProblem(existing);
    if (shared) {
      throw new Error(`${shared}; nothing was created`);
    }
    const id = typeof fromPrice === "string" ? fromPrice : fromPrice.id;
    const problem = findApiPollAddonProductTagProblem(
      await stripe.products.retrieve(id),
    );
    if (problem) {
      throw new Error(`${problem}; nothing was created`);
    }
    return id;
  }
  const products = stripe.products.list({ active: true, limit: 100 });
  for await (const product of products) {
    if (product.metadata?.[ADDON_METADATA_KEY] === API_ADDON) {
      return product.id;
    }
  }
  return undefined;
}

async function getTaxBehavior() {
  const prices = await stripe.prices.list({
    lookup_keys: [PRO_LOOKUP_KEYS.monthly],
  });
  return prices.data[0]?.tax_behavior ?? undefined;
}

(async function createApiPollAddonPrices() {
  const apply = process.argv.slice(2).includes("--apply");

  console.info(
    apply
      ? "⚠️  APPLY mode — the product and missing prices will be created, and price metadata corrected."
      : "🔍 DRY RUN — nothing will change. Pass --apply to write.",
  );

  const combos = API_POLL_TIERS.flatMap((tier) =>
    (["monthly", "yearly"] as const).map((interval) => ({ tier, interval })),
  );
  const existing = await stripe.prices.list({
    lookup_keys: combos.map(apiPollAddonLookupKey),
    expand: ["data.currency_options"],
  });
  const byKey = new Map(
    existing.data.map((price) => [price.lookup_key, price]),
  );

  const taxBehavior = await getTaxBehavior();
  console.info(`Tax behavior: ${taxBehavior ?? "unspecified"}`);

  let productId = await findProduct(existing.data);
  if (productId) {
    console.info(`Product: ${productId}`);
  } else if (apply) {
    const product = await stripe.products.create(
      {
        name: PRODUCT_NAME,
        metadata: { [ADDON_METADATA_KEY]: API_ADDON },
      },
      { idempotencyKey: PRODUCT_IDEMPOTENCY_KEY },
    );
    productId = product.id;
    console.info(`✅ Product: created ${productId}`);
  } else {
    console.info(`Product: would create "${PRODUCT_NAME}"`);
  }

  let mismatched = 0;

  for (const { tier, interval } of combos) {
    const key = apiPollAddonLookupKey({ tier, interval });
    const params = apiPollAddonPriceParams({
      product: productId ?? "(new product)",
      tier,
      interval,
      taxBehavior,
    });
    const found = byKey.get(key);

    if (found) {
      const mismatches = findApiPollAddonPriceMismatches({
        price: found,
        params,
      });
      if (mismatches.length > 0) {
        mismatched++;
        console.info(
          `❌ ${key}: mismatch on ${found.id}, left unchanged:\n   ${mismatches.join("\n   ")}`,
        );
        continue;
      }

      const metadata = findApiPollAddonMetadataUpdates({
        price: found,
        params,
      });
      const changes = Object.entries(metadata)
        .map(
          ([field, value]) =>
            `${field}: ${found.metadata[field] ?? "(missing)"} → ${value}`,
        )
        .join(", ");
      if (!changes) {
        console.info(`✅ ${key}: ok (${found.id})`);
      } else if (apply) {
        await stripe.prices.update(found.id, { metadata });
        console.info(`✅ ${key}: updated metadata on ${found.id} (${changes})`);
      } else {
        console.info(
          `✏️  ${key}: would update metadata on ${found.id} (${changes})`,
        );
      }
      continue;
    }

    const summary = `${params.currency}=${params.unit_amount}, ${Object.entries(
      params.currency_options ?? {},
    )
      .map(([currency, option]) => `${currency}=${option.unit_amount}`)
      .join(", ")}`;

    if (!apply || !productId) {
      console.info(`➕ ${key}: would create (${summary})`);
      continue;
    }

    const created = await stripe.prices.create(params, {
      idempotencyKey: `create-api-addon-price-${key}`,
    });
    console.info(`✅ ${key}: created ${created.id} (${summary})`);
  }

  if (mismatched > 0) {
    console.info(
      `\n${mismatched} lookup key(s) did not match and were left unchanged. Fix them in Stripe by hand.`,
    );
    process.exitCode = 1;
    return;
  }

  console.info(
    apply
      ? "\nDone. The app caches prices for one hour."
      : "\n🔍 Dry run complete. Re-run with --apply to write.",
  );
})();
