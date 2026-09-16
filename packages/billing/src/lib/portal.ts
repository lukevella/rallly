/**
 * Identity markers for the code defined billing portal configurations. Shared
 * between the app (which creates and reuses them) and the cleanup script
 * (which deactivates stale ones; Stripe has no DELETE for configurations).
 *
 * "flows" configurations are keyed by the pair of prices they allow, so a
 * price change creates a fresh configuration on next use instead of relying
 * on someone bumping a version. "account" is static; bump its version when
 * its feature set changes.
 */
export const PORTAL_CONFIG_PURPOSE = {
  flows: "flows",
  account: "account",
} as const;

export const ACCOUNT_PORTAL_CONFIG_VERSION = "1";

export function portalConfigPriceKey(priceIds: string[]) {
  return [...new Set(priceIds)].sort().join(",");
}

/**
 * A flows config is still live if it covers every id of at least one live
 * price pair (the current pair, or the early supporter pair) — it may also
 * carry extra ids (legacy tail-price subscribers folded in), which must not
 * make it look stale.
 */
export function portalConfigCoversPair({
  key,
  pairIds,
}: {
  key: string;
  pairIds: string[];
}) {
  const keyIds = new Set(key.split(",").filter(Boolean));
  return pairIds.every((id) => keyIds.has(id));
}
