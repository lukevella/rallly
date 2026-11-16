import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkLocales } from "./check.ts";
import { lockPath } from "./locales.ts";
import { hashSource } from "./lock.ts";

let tmp: string;

const web = (locale: string) =>
  join(tmp, "apps/web/public/locales", locale, "app.json");
const webLock = (locale: string) =>
  lockPath({ repoRoot: tmp, rootId: "web", locale, namespace: "app" });

const write = (path: string, value: unknown) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    typeof value === "string" ? value : JSON.stringify(value, null, 2),
  );
};

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "translations-check-"));
  mkdirSync(join(tmp, "apps/landing/public/locales/en"), { recursive: true });
  mkdirSync(join(tmp, "packages/emails/locales/en"), { recursive: true });
  write(web("en"), { b: "Hi {name}", c: "Close" });
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe("checkLocales", () => {
  it("flags an invalid translation whose lock is current", () => {
    write(web("de"), { b: "Hallo {nom}" });
    write(webLock("de"), { b: hashSource("Hi {name}") });
    const offenders = checkLocales({ repoRoot: tmp });
    expect(offenders).toHaveLength(1);
    expect(offenders[0]).toMatchObject({
      path: "apps/web/public/locales/de/app.json",
      key: "b",
    });
    expect(offenders[0]?.reasons.length).toBeGreaterThan(0);
  });

  it("passes a valid translation whose lock is current", () => {
    write(web("de"), { b: "Hallo {name}", c: "Schließen" });
    write(webLock("de"), {
      b: hashSource("Hi {name}"),
      c: hashSource("Close"),
    });
    expect(checkLocales({ repoRoot: tmp })).toEqual([]);
  });

  it("exempts a key whose English changed since it was translated", () => {
    write(web("de"), { b: "Hallo {nom}" });
    write(webLock("de"), { b: hashSource("Hello {name}") });
    expect(checkLocales({ repoRoot: tmp })).toEqual([]);
  });

  it("exempts missing keys, orphans and keys with no lock entry", () => {
    write(web("de"), { b: "Hallo {nom}", gone: "Alt {x" });
    write(webLock("de"), { gone: hashSource("Old") });
    expect(checkLocales({ repoRoot: tmp })).toEqual([]);
  });

  it("flags a locale file that is not valid JSON", () => {
    write(web("de"), "{ BROKEN");
    const offenders = checkLocales({ repoRoot: tmp });
    expect(offenders).toHaveLength(1);
    expect(offenders[0]).toMatchObject({
      path: "apps/web/public/locales/de/app.json",
      key: "*",
    });
  });

  it("flags a lockfile that is not a JSON object", () => {
    write(web("de"), { b: "Hallo {name}" });
    write(webLock("de"), "[]");
    const offenders = checkLocales({ repoRoot: tmp });
    expect(offenders).toHaveLength(1);
    expect(offenders[0]?.path).toBe("i18n/lock/web/de/app.json");
  });
});
