import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  listLocales,
  listNamespaces,
  lockPath,
  readMessages,
  writeMessages,
} from "./locales.ts";

const root = { id: "web", dir: "locales" } as const;

describe("locales", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "translations-"));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("returns empty messages for a missing file", () => {
    expect(readMessages(join(tmp, "nope.json"))).toEqual({});
  });

  it("reads an existing file", () => {
    const p = join(tmp, "app.json");
    writeFileSync(p, '{"a":"A"}');
    expect(readMessages(p)).toEqual({ a: "A" });
  });

  it("writes keys in English order with trailing newline", () => {
    const p = join(tmp, "de/app.json");
    writeMessages({ path: p, messages: { b: "B", a: "A" }, order: ["a", "b"] });
    expect(readFileSync(p, "utf8")).toBe('{\n  "a": "A",\n  "b": "B"\n}\n');
  });

  it("drops keys that are not in the order", () => {
    const p = join(tmp, "de/app.json");
    writeMessages({
      path: p,
      messages: { a: "A", gone: "X" },
      order: ["a", "missing"],
    });
    expect(readFileSync(p, "utf8")).toBe('{\n  "a": "A"\n}\n');
  });

  it("refuses to write an English file", () => {
    expect(() =>
      writeMessages({
        path: join(tmp, "en/app.json"),
        messages: {},
        order: [],
      }),
    ).toThrow();
  });

  it("allows a directory whose name only starts with en", () => {
    const p = join(tmp, "eng/app.json");
    writeMessages({ path: p, messages: { a: "A" }, order: ["a"] });
    expect(readMessages(p)).toEqual({ a: "A" });
  });

  it("lists locales without en", () => {
    const base = join(tmp, root.dir);
    for (const l of ["fr", "en", "de"])
      mkdirSync(join(base, l), { recursive: true });
    writeFileSync(join(base, "README.md"), "");
    expect(listLocales({ repoRoot: tmp, root })).toEqual(["de", "fr"]);
  });

  it("lists namespaces from the English directory", () => {
    const en = join(tmp, root.dir, "en");
    mkdirSync(en, { recursive: true });
    writeFileSync(join(en, "app.json"), "{}");
    writeFileSync(join(en, "emails.json"), "{}");
    writeFileSync(join(en, "notes.txt"), "");
    expect(listNamespaces({ repoRoot: tmp, root }).sort()).toEqual([
      "app",
      "emails",
    ]);
  });

  it("builds lock paths", () => {
    expect(
      lockPath({
        repoRoot: "/r",
        rootId: "web",
        locale: "de",
        namespace: "app",
      }),
    ).toBe("/r/i18n/lock/web/de/app.json");
  });
});
