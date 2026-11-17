import { describe, expect, it } from "vitest";
import { getPostAlternates } from "./alternates";

describe("getPostAlternates", () => {
  it("canonicalises a translated post to its own URL", () => {
    const alternates = getPostAlternates({
      locale: "de",
      slug: "a",
      translatedLocales: ["de"],
    });
    expect(alternates?.canonical).toMatch(/\/de\/blog\/a$/);
    expect(Object.keys(alternates?.languages ?? {}).sort()).toEqual([
      "de",
      "en",
      "x-default",
    ]);
    expect(alternates?.languages).not.toHaveProperty("fr");
  });

  it("canonicalises an untranslated locale to English", () => {
    const alternates = getPostAlternates({
      locale: "fr",
      slug: "a",
      translatedLocales: ["de"],
    });
    expect(alternates?.canonical).toMatch(/\/blog\/a$/);
    expect(alternates?.canonical).not.toContain("/fr/");
    expect(alternates?.canonical).not.toContain("/de/");
  });
});
