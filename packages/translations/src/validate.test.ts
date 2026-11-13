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

  it("rejects a plural without other and says so", () => {
    const reasons = v(
      "{count, plural, one {# poll} other {# polls}}",
      "{count, plural, one {# Umfrage}}",
    );
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toContain('"other" case');
    expect(reasons[0]).toContain("{count}");
  });

  it("rejects a select without other and says so", () =>
    expect(
      v("{k, select, a {A} other {B}}", "{k, select, a {A}}")[0],
    ).toContain('"other" case'));

  const select = "{interval, select, month {month} other {year}}";

  it("rejects a select with a dropped key", () => {
    const reasons = v(select, "{interval, select, other {Jahr}}");
    expect(reasons.join()).toContain('"month"');
  });

  it("rejects a select with a translated key", () => {
    const reasons = v(select, "{interval, select, monat {Monat} other {Jahr}}");
    expect(reasons.join()).toContain('"month"');
    expect(reasons.join()).toContain('"monat"');
  });

  it("accepts a select with the same keys", () =>
    expect(v(select, "{interval, select, month {Monat} other {Jahr}}")).toEqual(
      [],
    ));

  it("blames the apostrophe when it quotes a tag", () => {
    const reasons = v("The <b>organiser</b>", "L'<b>organisateur</b>");
    expect(reasons).not.toEqual([]);
    expect(reasons.join()).toContain("apostrophe");
  });

  it("refuses to validate a source using the reserved tag prefix", () =>
    expect(v("<num-0>A</num-0>", "<0>B</0>")).not.toEqual([]));

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

  const taggedPlural =
    "{n, plural, one {<b>#</b> vote} other {<b>#</b> votes}}";

  it("compares tags per plural branch, not as totals", () =>
    expect(
      v(
        taggedPlural,
        "{n, plural, one {<b>#</b> голос} few {<b>#</b> голоса} many {<b>#</b> голосов} other {<b>#</b> голоса}}",
      ),
    ).toEqual([]));

  it("rejects a plural branch that drops a tag", () => {
    const reasons = v(
      taggedPlural,
      "{n, plural, one {<b>#</b> голос} few {# голоса} many {<b>#</b> голосов} other {<b>#</b> голоса}}",
    );
    expect(reasons.join()).toContain("<b>");
  });

  it("blames the apostrophe for a tag quoted inside a branch", () =>
    expect(
      v(
        "{n, plural, one {<b>#</b> x} other {<b>#</b> xs}}",
        "{n, plural, one {'<b>#</b>' x} other {<b>#</b> xs}}",
      ).join(),
    ).toContain("apostrophe"));

  it("rejects a select branch that drops its tag", () =>
    expect(
      v(
        "{k, select, a {<b>A</b>} other {B}}",
        "{k, select, a {A} other {<b>B</b>}}",
      ),
    ).not.toEqual([]));

  it("compares nested branches", () => {
    const source =
      "{k, select, a {{n, plural, one {<b>#</b>} other {<b>#</b>}}} other {B}}";
    expect(
      v(
        source,
        "{k, select, a {{n, plural, one {<b>#</b>} few {<b>#</b>} other {<b>#</b>}}} other {B}}",
      ),
    ).toEqual([]);
    expect(
      v(
        source,
        "{k, select, a {{n, plural, one {<b>#</b>} few {#} other {<b>#</b>}}} other {B}}",
      ),
    ).not.toEqual([]);
  });

  it("checks every occurrence of a repeated select", () => {
    const source = "{k, select, a {A} other {B}} {k, select, a {C} other {D}}";
    expect(
      v(source, "{k, select, a {A} other {B}} {k, select, a {C} other {D}}"),
    ).toEqual([]);
    expect(
      v(source, "{k, select, x {A} other {B}} {k, select, a {C} other {D}}"),
    ).not.toEqual([]);
  });

  it("rejects a changed plural offset", () => {
    const source = "{n, plural, one {# vote} other {# votes}}";
    expect(
      v(source, "{n, plural, offset:1 one {# Stimme} other {# Stimmen}}"),
    ).not.toEqual([]);
    expect(
      v(
        "{n, plural, offset:1 one {# vote} other {# votes}}",
        "{n, plural, offset:1 one {# Stimme} other {# Stimmen}}",
      ),
    ).toEqual([]);
  });

  it("checks every branch of a plural the translation adds", () => {
    expect(
      v(
        "<b>{n}</b> votes",
        "{n, plural, one {<b>{n}</b> Stimme} other {<b>{n}</b> Stimmen}}",
      ),
    ).toEqual([]);
    expect(
      v(
        "<b>{n}</b> votes",
        "{n, plural, one {<b>{n}</b> Stimme} other {{n} Stimmen}}",
      ),
    ).not.toEqual([]);
  });

  it("requires every exact number case of the source plural", () => {
    const source = "{n, plural, =0 {<a>Add a vote</a>} other {# votes}}";
    const dropped = v(source, "{n, plural, other {# Stimmen}}");
    expect(dropped.join()).toContain('"=0"');
    expect(
      v(source, "{n, plural, =0 {<a>Stimme abgeben</a>} other {# Stimmen}}"),
    ).toEqual([]);
    expect(
      v(
        source,
        "{n, plural, =0 {<a>Stimme abgeben</a>} =1 {Eine Stimme} other {# Stimmen}}",
      ),
    ).toEqual([]);
  });

  it("pairs a select nested in a wrapper the translation adds", () => {
    const source = "{n} {k, select, a {<b>A</b>} other {B}}";
    expect(
      v(source, "{n, plural, other {# {k, select, a {<b>A</b>} other {B}}}}"),
    ).toEqual([]);
    expect(
      v(source, "{n, plural, other {# {k, select, x {<b>A</b>} other {B}}}}"),
    ).not.toEqual([]);
    expect(
      v(
        "{n} {k, select, a {A} other {B}}",
        "{n, plural, other {# {k, select, x {A} other {B}}}}",
      ),
    ).not.toEqual([]);
  });

  it("rejects the reserved tag prefix in the translation", () =>
    expect(v("<0>A</0>", "<num-0>B</num-0>")).not.toEqual([]));

  it("skips comparison when the source does not parse", () =>
    expect(v("broken {", "kaputt {")).toEqual([]));
});
