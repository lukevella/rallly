import { describe, expect, it } from "vitest";
import { formatMinorUnitAmount, getCountryCurrency } from "./pricing";

describe("getCountryCurrency", () => {
  const available = ["usd", "eur", "gbp"];

  it("maps the United Kingdom to GBP", () => {
    expect(getCountryCurrency("GB", available)).toBe("gbp");
  });

  it("maps euro area and EFTA countries to EUR", () => {
    expect(getCountryCurrency("DE", available)).toBe("eur");
    expect(getCountryCurrency("FR", available)).toBe("eur");
    expect(getCountryCurrency("CH", available)).toBe("eur");
    expect(getCountryCurrency("SE", available)).toBe("eur");
  });

  it("falls back to USD for everywhere else and when the country is unknown", () => {
    expect(getCountryCurrency("US", available)).toBe("usd");
    expect(getCountryCurrency("IN", available)).toBe("usd");
    expect(getCountryCurrency(undefined, available)).toBe("usd");
  });

  it("only returns a currency Stripe actually offers", () => {
    expect(getCountryCurrency("GB", ["usd", "eur"])).toBe("usd");
    expect(getCountryCurrency("US", ["eur", "gbp"])).toBe("eur");
  });
});

describe("formatMinorUnitAmount", () => {
  it("formats minor units as a localized currency string", () => {
    expect(
      formatMinorUnitAmount({ amount: 5600, currency: "usd", locale: "en" }),
    ).toBe("$56");
  });

  it("keeps cents when the amount needs them", () => {
    expect(
      formatMinorUnitAmount({ amount: 467, currency: "usd", locale: "en" }),
    ).toBe("$4.67");
  });

  it("keeps the trailing zero of a partial amount", () => {
    expect(
      formatMinorUnitAmount({ amount: 550, currency: "eur", locale: "en" }),
    ).toBe("€5.50");
  });

  it("does not scale zero decimal currencies", () => {
    expect(
      formatMinorUnitAmount({ amount: 5600, currency: "jpy", locale: "en" }),
    ).toBe("¥5,600");
  });
});
