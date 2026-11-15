import { describe, expect, it } from "vitest";
import {
  finalizeLocationPollSchema,
  MAX_PLACE_ADDRESS_LENGTH,
  MAX_PLACE_NAME_LENGTH,
  MAX_PLACE_URL_LENGTH,
  pollPlaceSchema,
} from "./schema";

describe("pollPlaceSchema", () => {
  it("keeps a fully described place", () => {
    expect(
      pollPlaceSchema.parse({
        name: "Café du Centre",
        address: "12 rue de la Paix, Paris",
        url: "https://maps.example.com/cafe",
      }),
    ).toEqual({
      name: "Café du Centre",
      address: "12 rue de la Paix, Paris",
      url: "https://maps.example.com/cafe",
    });
  });

  it("trims the name and the address", () => {
    expect(
      pollPlaceSchema.parse({ name: "  Le Bistrot  ", address: "  1 rue A  " }),
    ).toEqual({ name: "Le Bistrot", address: "1 rue A", url: undefined });
  });

  it("needs only a name", () => {
    expect(pollPlaceSchema.parse({ name: "Le Bistrot" })).toEqual({
      name: "Le Bistrot",
      address: undefined,
      url: undefined,
    });
  });

  it("turns the empty strings of an untouched form into undefined", () => {
    expect(
      pollPlaceSchema.parse({ name: "Le Bistrot", address: "", url: "" }),
    ).toEqual({ name: "Le Bistrot", address: undefined, url: undefined });
  });

  it("rejects a missing or blank name", () => {
    expect(pollPlaceSchema.safeParse({}).success).toBe(false);
    expect(pollPlaceSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects values over their length limit", () => {
    expect(
      pollPlaceSchema.safeParse({ name: "a".repeat(MAX_PLACE_NAME_LENGTH + 1) })
        .success,
    ).toBe(false);
    expect(
      pollPlaceSchema.safeParse({
        name: "ok",
        address: "a".repeat(MAX_PLACE_ADDRESS_LENGTH + 1),
      }).success,
    ).toBe(false);
    expect(
      pollPlaceSchema.safeParse({
        name: "ok",
        url: `https://example.com/${"a".repeat(MAX_PLACE_URL_LENGTH)}`,
      }).success,
    ).toBe(false);
  });

  it("rejects a link that is not a URL", () => {
    expect(
      pollPlaceSchema.safeParse({ name: "ok", url: "not a url" }).success,
    ).toBe(false);
  });

  it("only accepts http and https links", () => {
    expect(
      pollPlaceSchema.safeParse({ name: "ok", url: "javascript:alert(1)" })
        .success,
    ).toBe(false);
    expect(
      pollPlaceSchema.safeParse({ name: "ok", url: "ftp://example.com" })
        .success,
    ).toBe(false);
    expect(
      pollPlaceSchema.safeParse({ name: "ok", url: "http://example.com" })
        .success,
    ).toBe(true);
  });
});

describe("finalizeLocationPollSchema", () => {
  it("needs a poll and an option", () => {
    expect(
      finalizeLocationPollSchema.parse({ pollId: "p1", optionId: "o1" }),
    ).toEqual({ pollId: "p1", optionId: "o1" });
    expect(finalizeLocationPollSchema.safeParse({ pollId: "p1" }).success).toBe(
      false,
    );
  });
});
