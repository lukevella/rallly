import { describe, expect, it } from "vitest";
import { portalConfigCoversPair, portalConfigPriceKey } from "./portal";

describe("portalConfigPriceKey", () => {
  it("is order independent so the same price set always resolves the same configuration", () => {
    expect(portalConfigPriceKey(["price_b", "price_a"])).toBe(
      portalConfigPriceKey(["price_a", "price_b"]),
    );
  });

  it("distinguishes different price sets", () => {
    expect(portalConfigPriceKey(["price_a", "price_b"])).not.toBe(
      portalConfigPriceKey(["price_a", "price_c"]),
    );
  });

  it("deduplicates repeated ids", () => {
    expect(portalConfigPriceKey(["price_a", "price_a", "price_b"])).toBe(
      portalConfigPriceKey(["price_a", "price_b"]),
    );
  });
});

describe("portalConfigCoversPair", () => {
  it("is true when the key contains every id of the pair", () => {
    expect(
      portalConfigCoversPair({
        key: "price_a,price_b",
        pairIds: ["price_a", "price_b"],
      }),
    ).toBe(true);
  });

  it("is true when the key has extra ids beyond the pair", () => {
    expect(
      portalConfigCoversPair({
        key: "price_a,price_b,price_legacy",
        pairIds: ["price_a", "price_b"],
      }),
    ).toBe(true);
  });

  it("is false when the key is missing one of the pair's ids", () => {
    expect(
      portalConfigCoversPair({
        key: "price_a",
        pairIds: ["price_a", "price_b"],
      }),
    ).toBe(false);
  });
});
