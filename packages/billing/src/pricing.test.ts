import { describe, expect, it } from "vitest";
import {
  API_POLL_TIERS,
  apiPollAddonAmounts,
  apiPollAddonFallback,
  displayedCurrencies,
  formatMinorUnitAmount,
  getCountryCurrency,
} from "./pricing";

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

describe("apiPollAddonFallback", () => {
  it("holds the USD amounts in minor units", () => {
    expect(apiPollAddonFallback[2500]).toEqual({
      monthly: 20000,
      yearly: 200000,
    });
  });
});

describe("apiPollAddonAmounts", () => {
  it("prices a year at exactly ten months in every tier and currency", () => {
    for (const currency of displayedCurrencies) {
      for (const tier of API_POLL_TIERS) {
        const { monthly, yearly } = apiPollAddonAmounts[currency][tier];
        expect(yearly).toBe(monthly * 10);
      }
    }
  });

  it("pins the whole monthly table", () => {
    const monthly = Object.fromEntries(
      displayedCurrencies.map((currency) => [
        currency,
        Object.fromEntries(
          API_POLL_TIERS.map((tier) => [
            tier,
            apiPollAddonAmounts[currency][tier].monthly,
          ]),
        ),
      ]),
    );
    expect(monthly).toEqual({
      usd: { 250: 3000, 500: 5000, 1000: 9000, 2500: 20000 },
      eur: { 250: 2700, 500: 4500, 1000: 8000, 2500: 18000 },
      gbp: { 250: 2400, 500: 4000, 1000: 7000, 2500: 16000 },
    });
  });

  it("holds the per currency monthly amounts", () => {
    expect(apiPollAddonAmounts.eur[1000].monthly).toBe(8000);
    expect(apiPollAddonAmounts.gbp[250].monthly).toBe(2400);
  });
});
