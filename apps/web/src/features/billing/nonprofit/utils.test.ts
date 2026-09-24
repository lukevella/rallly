import { describe, expect, it } from "vitest";
import { buildCheckoutDiscountParams } from "./utils";

describe("buildCheckoutDiscountParams", () => {
  it("attaches the coupon and drops promotion codes for an entitled space", () => {
    expect(buildCheckoutDiscountParams("nonprofit-20")).toEqual({
      session: { discounts: [{ coupon: "nonprofit-20" }] },
      recovery: { allow_promotion_codes: false },
    });
  });

  it("keeps promotion codes and no discount otherwise", () => {
    const params = buildCheckoutDiscountParams(null);
    expect(params.session).toEqual({ allow_promotion_codes: true });
    expect(params.session).not.toHaveProperty("discounts");
    expect(params.recovery).toEqual({ allow_promotion_codes: true });
  });
});
