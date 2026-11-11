import { describe, expect, it } from "vitest";
import {
  API_POLL_TIERS,
  apiPollAddonAmounts,
  apiPollAddonFallback,
  apiPollTierLimits,
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

describe("apiPollTierLimits", () => {
  it("maps each tier to its monthly poll limit", () => {
    expect(apiPollTierLimits).toEqual({
      small: 250,
      medium: 500,
      large: 1000,
      xlarge: 2500,
    });
  });
});

describe("apiPollAddonFallback", () => {
  it("holds the USD amounts in minor units", () => {
    expect(apiPollAddonFallback.xlarge).toEqual({
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
      usd: { small: 3000, medium: 5000, large: 9000, xlarge: 20000 },
      eur: { small: 2700, medium: 4500, large: 8000, xlarge: 18000 },
      gbp: { small: 2400, medium: 4000, large: 7000, xlarge: 16000 },
    });
  });

  it("holds the per currency monthly amounts", () => {
    expect(apiPollAddonAmounts.eur.large.monthly).toBe(8000);
    expect(apiPollAddonAmounts.gbp.small.monthly).toBe(2400);
  });
});
