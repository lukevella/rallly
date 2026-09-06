import { describe, expect, it } from "vitest";
import { getCountryCurrency, yearlySavingsPercent } from "./pricing";

describe("yearlySavingsPercent", () => {
  it("rounds the saving of yearly against twelve months to a whole percent", () => {
    expect(yearlySavingsPercent({ monthly: 700, yearly: 5600 })).toBe(33);
    expect(yearlySavingsPercent({ monthly: 560, yearly: 4500 })).toBe(33);
    expect(yearlySavingsPercent({ monthly: 1000, yearly: 8400 })).toBe(30);
  });

  it("is zero when yearly costs the same as twelve months", () => {
    expect(yearlySavingsPercent({ monthly: 100, yearly: 1200 })).toBe(0);
  });
});

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
