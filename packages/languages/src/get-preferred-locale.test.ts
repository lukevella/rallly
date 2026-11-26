import { describe, expect, it } from "vitest";
import { getPreferredLocaleFromHeaders } from "./get-preferred-locale";

const detect = (acceptLanguageHeader: string) =>
  getPreferredLocaleFromHeaders({ acceptLanguageHeader });

describe("getPreferredLocaleFromHeaders", () => {
  it.each([
    ["uk", "en"],
    ["uk-UA", "en"],
    ["be", "en"],
    ["kk", "en"],
    ["uk,de;q=0.8", "de"],
  ])("does not serve Russian to %s", (header, expected) => {
    expect(detect(header)).toBe(expected);
  });

  it.each([
    ["ru", "ru"],
    ["ru-UA", "ru"],
    ["uk,ru;q=0.8", "ru"],
  ])("serves Russian when %s asks for it", (header, expected) => {
    expect(detect(header)).toBe(expected);
  });

  it.each([
    ["pt", "pt-BR"],
    ["pt-PT", "pt-PT"],
    ["en-AU", "en-GB"],
    ["en-GB", "en-GB"],
    ["de-AT", "de"],
  ])("keeps best fit for %s", (header, expected) => {
    expect(detect(header)).toBe(expected);
  });
});
