import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Glossary } from "./prompt.ts";
import {
  buildSystem,
  buildUser,
  languageName,
  loadGlossary,
} from "./prompt.ts";

const glossary: Glossary = {
  doNotTranslate: ["Rallly", "Zoom"],
  terms: [
    {
      en: "Poll",
      note: "a scheduling poll",
      translations: { de: "Umfrage", fr: "Sondage" },
    },
    { en: "Pro", note: "the paid plan", translations: {} },
  ],
};

describe("languageName", () => {
  it("returns the English name", () =>
    expect(languageName("no")).toBe("Norwegian Bokmål"));
  it("throws for an unknown locale", () =>
    expect(() => languageName("xx")).toThrow(/xx/));
});

describe("buildSystem", () => {
  it("names the language and locale", () =>
    expect(buildSystem({ locale: "pt-BR", glossary, reference: {} })).toContain(
      "Brazilian Portuguese (pt-BR)",
    ));

  it("includes only this locale's glossary translations", () => {
    const s = buildSystem({ locale: "de", glossary, reference: {} });
    expect(s).toContain("Umfrage");
    expect(s).not.toContain("Sondage");
  });

  it("does not carry another locale's translation into a locale without one", () => {
    const s = buildSystem({ locale: "es", glossary, reference: {} });
    expect(s).not.toContain("Umfrage");
    expect(s).not.toContain("Sondage");
  });

  it("uses the French translation for French", () => {
    const s = buildSystem({ locale: "fr", glossary, reference: {} });
    expect(s).toContain("Sondage");
    expect(s).not.toContain("Umfrage");
  });

  it("lists terms without a translation for this locale with their note", () => {
    const s = buildSystem({ locale: "de", glossary, reference: {} });
    expect(s).toContain("the paid plan");
  });

  it("lists the do-not-translate terms", () => {
    const s = buildSystem({ locale: "de", glossary, reference: {} });
    expect(s).toContain("Rallly, Zoom");
  });

  it("states that select keys are never translated and plurals include other", () => {
    const s = buildSystem({ locale: "de", glossary, reference: {} });
    expect(s).toContain(
      "Select option keys are identifiers and must never be translated",
    );
    expect(s).toContain("`other`");
  });

  it("states every format rule", () => {
    const s = buildSystem({ locale: "de", glossary, reference: {} });
    for (const rule of [
      "Keep every ICU argument (such as {name}), plural and select structure, and tag name (such as <b>) exactly as in the source.",
      "Plural categories must be the ones the target language needs.",
      "Every plural and every select must include an `other` case.",
      "Translate only the human-readable text.",
      "Follow German's own capitalization conventions",
      "Return every requested key.",
    ]) {
      expect(s).toContain(rule);
    }
  });

  it("does not tell the model to pick a term for do-not-translate entries", () => {
    const proGlossary: Glossary = {
      doNotTranslate: ["Pro"],
      terms: [{ en: "Poll", note: "a poll", translations: {} }],
    };
    const s = buildSystem({
      locale: "de",
      glossary: proGlossary,
      reference: {},
    });
    expect(s).toContain("Never translate these terms: Pro.");
    expect(s).not.toContain('"Pro"');
  });

  it("throws for an unknown locale", () =>
    expect(() =>
      buildSystem({ locale: "xx", glossary, reference: {} }),
    ).toThrow());

  it("orders role, rules, glossary, reference", () => {
    const s = buildSystem({
      locale: "de",
      glossary,
      reference: { greeting: "Hallo" },
    });
    const order = [
      "You are a professional translator",
      "## Rules",
      "## Glossary",
      "## Existing translations",
      '"greeting": "Hallo"',
    ].map((marker) => s.indexOf(marker));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

describe("buildUser", () => {
  it("includes previous translation and error only when present", () => {
    const u = buildUser({
      items: [
        { key: "a", source: "Save" },
        {
          key: "b",
          source: "Hi {name}",
          previous: "Hallo {nom}",
          error: "missing argument name",
        },
      ],
    });
    expect(JSON.parse(u)).toEqual([
      { key: "a", source: "Save" },
      {
        key: "b",
        source: "Hi {name}",
        previous: "Hallo {nom}",
        error: "missing argument name",
      },
    ]);
  });
});

describe("loadGlossary", () => {
  const withDir = (write: (dir: string) => void) => {
    const dir = mkdtempSync(join(tmpdir(), "glossary-"));
    mkdirSync(join(dir, "i18n"));
    write(dir);
    return dir;
  };

  it("loads a valid glossary", () => {
    const dir = withDir((d) =>
      writeFileSync(join(d, "i18n", "glossary.json"), JSON.stringify(glossary)),
    );
    expect(loadGlossary({ repoRoot: dir })).toEqual(glossary);
  });
  it("throws a clear error when missing", () =>
    expect(() => loadGlossary({ repoRoot: withDir(() => {}) })).toThrow(
      /not found/,
    ));
  it("throws a clear error when malformed", () => {
    const dir = withDir((d) =>
      writeFileSync(join(d, "i18n", "glossary.json"), '{"terms": 1}'),
    );
    expect(() => loadGlossary({ repoRoot: dir })).toThrow(/malformed/);
  });
  it("loads the committed glossary", () => {
    const repoRoot = join(import.meta.dirname, "..", "..", "..");
    const committed = loadGlossary({ repoRoot });
    expect(committed.doNotTranslate).toContain("Rallly");
    expect(committed.doNotTranslate).toContain("Pro");
    expect(committed.terms.map((term) => term.en)).not.toContain("Pro");
  });
});
