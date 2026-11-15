import { describe, expect, it } from "vitest";
import { hashSource, isCurrent, planLocale } from "./lock.ts";

const en = {
  a: "Save",
  b: "Hi {name}",
  c: "Close",
  d: "__STRING_NOT_TRANSLATED__",
};

describe("hashSource", () => {
  it("is the first 16 hex characters of the sha-256", () => {
    expect(hashSource("Save")).toMatch(/^[0-9a-f]{16}$/);
    expect(hashSource("Save")).toBe(hashSource("Save"));
    expect(hashSource("Save")).not.toBe(hashSource("Store"));
  });
});

describe("isCurrent", () => {
  it("is true when the lock matches the current English", () =>
    expect(isCurrent({ key: "a", en, lock: { a: hashSource("Save") } })).toBe(
      true,
    ));
  it("is false when the English changed", () =>
    expect(isCurrent({ key: "a", en, lock: { a: hashSource("Store") } })).toBe(
      false,
    ));
  it("is false without a lock entry", () =>
    expect(isCurrent({ key: "a", en, lock: {} })).toBe(false));
});

describe("planLocale", () => {
  it("marks missing keys stale", () =>
    expect(planLocale({ en, messages: {}, lock: {} }).stale).toEqual([
      "a",
      "b",
      "c",
    ]));

  it("adopts valid translations with no lock entry", () => {
    const plan = planLocale({ en, messages: { a: "Speichern" }, lock: {} });
    expect(plan.adopt).toEqual(["a"]);
    expect(plan.stale).toEqual(["b", "c"]);
  });

  it("marks invalid legacy translations stale instead of adopting", () => {
    const plan = planLocale({ en, messages: { b: "Hallo {nom}" }, lock: {} });
    expect(plan.adopt).toEqual([]);
    expect(plan.stale).toContain("b");
  });

  it("marks an invalid translation stale even when the lock is current", () => {
    const plan = planLocale({
      en,
      messages: { b: "Hallo {nom}" },
      lock: { b: hashSource("Hi {name}") },
    });
    expect(plan.stale).toContain("b");
    expect(plan.adopt).toEqual([]);
  });

  it("leaves a human edit alone when the source is unchanged", () => {
    const plan = planLocale({
      en,
      messages: { a: "Sichern" },
      lock: { a: hashSource("Save") },
    });
    expect(plan).toEqual({ stale: ["b", "c"], adopt: [], orphans: [] });
  });

  it("marks a key stale when the English changed", () =>
    expect(
      planLocale({
        en,
        messages: { a: "Speichern" },
        lock: { a: hashSource("Store") },
      }).stale,
    ).toContain("a"));

  it("does not adopt a key whose English changed", () =>
    expect(
      planLocale({
        en,
        messages: { a: "Speichern" },
        lock: { a: hashSource("Store") },
      }).adopt,
    ).toEqual([]));

  it("reports orphans from messages and lock", () =>
    expect(
      planLocale({
        en,
        messages: { z: "Alt" },
        lock: { y: "abc" },
      }).orphans.sort(),
    ).toEqual(["y", "z"]));

  it("never plans the untranslated English placeholder", () => {
    const plan = planLocale({
      en,
      messages: { d: "irgendwas" },
      lock: {},
    });
    expect([...plan.stale, ...plan.adopt]).not.toContain("d");
  });

  it("never plans an empty English string", () => {
    const plan = planLocale({ en: { e: "" }, messages: {}, lock: {} });
    expect(plan).toEqual({ stale: [], adopt: [], orphans: [] });
  });

  it("follows English key order", () => {
    const plan = planLocale({
      en: { z: "Z", y: "Y", x: "X" },
      messages: { y: "Why" },
      lock: {},
    });
    expect(plan.stale).toEqual(["z", "x"]);
    expect(plan.adopt).toEqual(["y"]);
  });
});
