import { describe, expect, it } from "vitest";
import { validateTranslation } from "./validate.ts";

const v = (source: string, translation: string) =>
  validateTranslation({ source, translation });

describe("validateTranslation", () => {
  it("accepts a plain translation", () =>
    expect(v("Save", "Speichern")).toEqual([]));

  it("rejects empty and placeholder", () => {
    expect(v("Save", "")).not.toEqual([]);
    expect(v("Save", "__STRING_NOT_TRANSLATED__")).not.toEqual([]);
  });

  it("rejects the Crowdin join artifact", () =>
    expect(v("Save availability", "Verfügbarkeit speichern},{")).not.toEqual(
      [],
    ));

  it("rejects a renamed argument", () =>
    expect(v("Hi {name}", "Hallo {nom}")).not.toEqual([]));

  it("rejects an argument swallowed by apostrophe quoting", () => {
    expect(v("Poll by {name}", "Sondage d'{name}'")).not.toEqual([]);
    expect(v("Poll by {name}", "Sondage d'{name}")).not.toEqual([]);
  });

  it("accepts an apostrophe that does not quote", () => {
    expect(v("Poll by {name}", "Sondage de l'organisateur {name}")).toEqual([]);
    expect(v("Poll by {name}", "Sondage d''{name}")).toEqual([]);
  });

  it("accepts extra plural categories", () =>
    expect(
      v(
        "{count, plural, one {# poll} other {# polls}}",
        "{count, plural, one {# опрос} few {# опроса} many {# опросов} other {# опроса}}",
      ),
    ).toEqual([]));

  it("rejects a plural without other", () =>
    expect(
      v(
        "{count, plural, one {# poll} other {# polls}}",
        "{count, plural, one {# Umfrage}}",
      ),
    ).not.toEqual([]));

  it("rejects a plural flattened to a simple argument", () =>
    expect(
      v("{count, plural, one {# poll} other {# polls}}", "{count} Umfragen"),
    ).not.toEqual([]));

  it("rejects a dropped or renamed tag", () => {
    expect(v("Read the <a>docs</a>", "Lies die Doku")).not.toEqual([]);
    expect(v("<b>{n}</b> votes", "<i>{n}</i> Stimmen")).not.toEqual([]);
  });

  it("accepts reordered tags", () =>
    expect(v("<0>A</0> and <1>B</1>", "<1>B</1> und <0>A</0>")).toEqual([]));

  it("rejects badly nested tags", () =>
    expect(v("<0>A <1>B</1></0>", "<0>A <1>B</0></1>")).not.toEqual([]));

  it("requires self-closing tags to survive", () => {
    expect(v("Line<br/>break", "Zeile<br/>Umbruch")).toEqual([]);
    expect(v("Line<br/>break", "Zeilenumbruch")).not.toEqual([]);
  });

  it("skips comparison when the source does not parse", () =>
    expect(v("broken {", "kaputt {")).toEqual([]));
});
