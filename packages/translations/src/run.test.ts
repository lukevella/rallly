import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { lockPath } from "./locales.ts";
import { hashSource } from "./lock.ts";
import { formatReport, run, shouldFail } from "./run.ts";
import type { Complete } from "./translator.ts";

type Call = { messages: { role: string; content: string }[] };

let tmp: string;
let calls: Call[];

const model = "test/model";
const localesDir = () => join(tmp, "apps/web/public/locales");
const localePath = (locale: string) => join(localesDir(), locale, "app.json");

const write = (path: string, value: unknown) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2));
};
const read = (locale: string) =>
  JSON.parse(readFileSync(localePath(locale), "utf8"));
const readLock = (locale: string) =>
  JSON.parse(
    readFileSync(
      lockPath({ repoRoot: tmp, rootId: "web", locale, namespace: "app" }),
      "utf8",
    ),
  );

const lastContent = (call: Call | undefined) =>
  call?.messages[call.messages.length - 1]?.content ?? "";

const respondWith = (translations: { key: string; value: string }[]) => ({
  choices: [
    {
      message: { content: JSON.stringify({ translations }) },
      finish_reason: "stop",
    },
  ],
});

const echo =
  (
    transform: (source: string, key: string) => string = (s) => `[de] ${s}`,
  ): Complete =>
  async (params) => {
    const call = params as Call;
    calls.push(call);
    const items = JSON.parse(lastContent(call)) as {
      key: string;
      source: string;
    }[];
    return respondWith(
      items.map(({ key, source }) => ({ key, value: transform(source, key) })),
    );
  };

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "translations-run-"));
  calls = [];
  write(join(tmp, "i18n/glossary.json"), { doNotTranslate: [], terms: [] });
  write(join(localesDir(), "en/app.json"), { a: "Save", b: "Hi {name}" });
  write(localePath("de"), { a: "Speichern", old: "Alt" });
});

afterEach(() => rmSync(tmp, { recursive: true, force: true }));

describe("run", () => {
  it("fills gaps, adopts, removes orphans and writes the lock", async () => {
    const report = await run({ repoRoot: tmp, complete: echo(), model });
    expect(read("de")).toEqual({ a: "Speichern", b: "[de] Hi {name}" });
    expect(readLock("de")).toEqual({
      a: hashSource("Save"),
      b: hashSource("Hi {name}"),
    });
    expect(report.model).toBe(model);
    expect(report.files).toHaveLength(1);
    expect(report.files[0]).toMatchObject({
      path: "web/de/app",
      translated: 1,
      adopted: 1,
      removed: 1,
      failed: [],
    });
  });

  it("is a no-op on the second run", async () => {
    await run({ repoRoot: tmp, complete: echo(), model });
    calls.length = 0;
    const lockFile = lockPath({
      repoRoot: tmp,
      rootId: "web",
      locale: "de",
      namespace: "app",
    });
    const before = [
      statSync(localePath("de")).mtimeMs,
      statSync(lockFile).mtimeMs,
    ];
    await new Promise((resolve) => setTimeout(resolve, 20));
    const report = await run({ repoRoot: tmp, complete: echo(), model });
    expect(calls).toHaveLength(0);
    expect(report.files[0]).toMatchObject({
      translated: 0,
      adopted: 0,
      removed: 0,
    });
    expect([
      statSync(localePath("de")).mtimeMs,
      statSync(lockFile).mtimeMs,
    ]).toEqual(before);
  });

  it("keeps a human edit until the English changes, then sends it as previous", async () => {
    await run({ repoRoot: tmp, complete: echo(), model });
    calls.length = 0;
    write(localePath("de"), { a: "Sichern", b: "[de] Hi {name}" });
    await run({ repoRoot: tmp, complete: echo(), model });
    expect(read("de").a).toBe("Sichern");
    expect(calls).toHaveLength(0);

    write(join(localesDir(), "en/app.json"), {
      a: "Save changes",
      b: "Hi {name}",
    });
    await run({ repoRoot: tmp, complete: echo(), model });
    expect(JSON.parse(lastContent(calls[calls.length - 1]))[0]).toMatchObject({
      key: "a",
      previous: "Sichern",
    });
    expect(read("de").a).toBe("[de] Save changes");
    expect(readLock("de").a).toBe(hashSource("Save changes"));
  });

  it("leaves the old translation and lock when a key fails", async () => {
    write(join(localesDir(), "en/app.json"), { a: "Save", b: "Hi {name}" });
    await run({ repoRoot: tmp, complete: echo(), model });
    const lockBefore = readLock("de");

    write(join(localesDir(), "en/app.json"), { a: "Save", b: "Hello {name}" });
    const report = await run({
      repoRoot: tmp,
      complete: echo((source, key) => (key === "b" ? "no argument" : source)),
      model,
    });
    expect(read("de").b).toBe("[de] Hi {name}");
    expect(readLock("de")).toEqual(lockBefore);
    expect(report.files[0]?.translated).toBe(0);
    expect(report.files[0]?.failed.map(({ key }) => key)).toEqual(["b"]);
  });

  it("writes the keys that succeed and locks only those", async () => {
    write(join(localesDir(), "en/app.json"), {
      a: "Save",
      b: "Hi {name}",
      c: "Close",
    });
    write(localePath("de"), {});
    const report = await run({
      repoRoot: tmp,
      complete: echo((source, key) =>
        key === "b" ? "no argument" : `[de] ${source}`,
      ),
      model,
    });
    expect(read("de")).toEqual({ a: "[de] Save", c: "[de] Close" });
    expect(readLock("de")).toEqual({
      a: hashSource("Save"),
      c: hashSource("Close"),
    });
    expect(report.files[0]).toMatchObject({ translated: 2 });
    expect(report.files[0]?.failed.map(({ key }) => key)).toEqual(["b"]);
  });

  it("gives the model the existing translations as reference", async () => {
    await run({ repoRoot: tmp, complete: echo(), model });
    expect(calls[0]?.messages[0]?.content).toContain("Speichern");
  });

  it("isolates a malformed locale file and names it", async () => {
    write(localePath("fr"), {});
    writeFileSync(localePath("fr"), "{ BROKEN");
    const report = await run({ repoRoot: tmp, complete: echo(), model });
    expect(read("de").b).toBe("[de] Hi {name}");
    const fr = report.files.find((file) => file.path === "web/fr/app");
    expect(fr?.failed).toHaveLength(1);
    expect(fr?.failed[0]?.key).toBe("*");
    expect(fr?.failed[0]?.reason).toContain(localePath("fr"));
    expect(readFileSync(localePath("fr"), "utf8")).toBe("{ BROKEN");
  });

  it("does not rewrite messages when a run only adopts", async () => {
    write(localePath("de"), { b: "Hi {name}-de", a: "Speichern" });
    write(join(localesDir(), "en/app.json"), { a: "Save", b: "Hi {name}" });
    const before = readFileSync(localePath("de"), "utf8");
    const report = await run({ repoRoot: tmp, complete: echo(), model });
    expect(report.files[0]).toMatchObject({
      translated: 0,
      adopted: 2,
      removed: 0,
    });
    expect(readFileSync(localePath("de"), "utf8")).toBe(before);
    expect(readLock("de")).toEqual({
      a: hashSource("Save"),
      b: hashSource("Hi {name}"),
    });
    expect(calls).toHaveLength(0);
  });

  it("does not rewrite messages when only a lock orphan is removed, and drops it from the lock", async () => {
    write(localePath("de"), { b: "Hi {name}-de", a: "Speichern" });
    await run({ repoRoot: tmp, complete: echo(), model });
    const lockFile = lockPath({
      repoRoot: tmp,
      rootId: "web",
      locale: "de",
      namespace: "app",
    });
    write(lockFile, { ...readLock("de"), gone: "deadbeef" });
    const before = readFileSync(localePath("de"), "utf8");
    const report = await run({ repoRoot: tmp, complete: echo(), model });
    expect(report.files[0]).toMatchObject({
      translated: 0,
      adopted: 0,
      removed: 1,
    });
    expect(readFileSync(localePath("de"), "utf8")).toBe(before);
    expect(readLock("de")).toEqual({
      a: hashSource("Save"),
      b: hashSource("Hi {name}"),
    });
  });

  it("reports a write failure, keeps messages before lock, and continues", async () => {
    write(localePath("fr"), { a: "Sauver" });
    write(join(tmp, "i18n/lock/web/de"), "not a directory");
    const report = await run({ repoRoot: tmp, complete: echo(), model });
    const de = report.files.find((file) => file.path === "web/de/app");
    expect(de?.failed).toHaveLength(1);
    expect(de?.failed[0]?.key).toBe("*");
    expect(de?.failed[0]?.reason).toContain(join(tmp, "i18n/lock/web/de"));
    expect(read("de").b).toBe("[de] Hi {name}");
    const fr = report.files.find((file) => file.path === "web/fr/app");
    expect(fr?.failed).toEqual([]);
    expect(read("fr")).toEqual({ a: "Sauver", b: "[de] Hi {name}" });
    expect(readLock("fr")).toEqual({
      a: hashSource("Save"),
      b: hashSource("Hi {name}"),
    });
  });

  it.each([
    {
      name: "an array messages file",
      target: "messages",
      content: "[]",
      found: "an array",
    },
    {
      name: "a string lock file",
      target: "lock",
      content: '"text"',
      found: "string",
    },
    {
      name: "a null messages file",
      target: "messages",
      content: "null",
      found: "null",
    },
  ])("reports $name and leaves it untouched", async ({
    target,
    content,
    found,
  }) => {
    const file =
      target === "messages"
        ? localePath("de")
        : lockPath({
            repoRoot: tmp,
            rootId: "web",
            locale: "de",
            namespace: "app",
          });
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
    const report = await run({ repoRoot: tmp, complete: echo(), model });
    expect(report.files[0]?.failed).toHaveLength(1);
    expect(report.files[0]?.failed[0]?.reason).toContain(file);
    expect(report.files[0]?.failed[0]?.reason).toContain(found);
    expect(readFileSync(file, "utf8")).toBe(content);
    expect(calls).toHaveLength(0);
  });

  it("writes nothing on dry run but still reports", async () => {
    const deBefore = readFileSync(localePath("de"), "utf8");
    const report = await run({
      repoRoot: tmp,
      complete: echo(),
      model,
      dryRun: true,
    });
    expect(readFileSync(localePath("de"), "utf8")).toBe(deBefore);
    expect(existsSync(join(tmp, "i18n/lock"))).toBe(false);
    expect(calls).toHaveLength(1);
    expect(report.files[0]).toMatchObject({
      translated: 1,
      adopted: 1,
      removed: 1,
    });
  });

  it("continues with other files when one request throws", async () => {
    write(localePath("fr"), {});
    const complete: Complete = async (params) => {
      const call = params as Call;
      if (call.messages[0]?.content.includes("(fr)")) {
        throw new Error("boom");
      }
      return echo()(params);
    };
    const report = await run({ repoRoot: tmp, complete, model });
    expect(read("de").b).toBe("[de] Hi {name}");
    const fr = report.files.find((file) => file.path === "web/fr/app");
    expect(fr).toMatchObject({
      translated: 0,
      failed: [
        { key: "a", reason: "boom" },
        { key: "b", reason: "boom" },
      ],
    });
    expect(readFileSync(localePath("fr"), "utf8")).toBe("{}");
    expect(
      report.files.find((file) => file.path === "web/de/app")?.failed,
    ).toEqual([]);
  });

  it("writes and locks the chunks that completed before a request threw", async () => {
    const en = Object.fromEntries(
      Array.from({ length: 250 }, (_, i) => [`k${i}`, `Source ${i}`]),
    );
    write(join(localesDir(), "en/app.json"), en);
    write(localePath("de"), {});
    let count = 0;
    const complete: Complete = async (params) => {
      count++;
      if (count === 2) throw new Error("429 flex capacity");
      return echo()(params);
    };
    const report = await run({ repoRoot: tmp, complete, model });
    const written = read("de");
    const lock = readLock("de");
    expect(Object.keys(written)).toHaveLength(150);
    expect(written.k0).toBe("[de] Source 0");
    expect(written.k249).toBe("[de] Source 249");
    expect(written).not.toHaveProperty("k100");
    expect(Object.keys(lock)).toEqual(Object.keys(written));
    expect(lock.k0).toBe(hashSource("Source 0"));
    expect(report.files[0]?.translated).toBe(150);
    expect(report.files[0]?.failed).toHaveLength(100);
    expect(report.files[0]?.failed[0]).toEqual({
      key: "k100",
      reason: "429 flex capacity",
    });
  });

  it("runs at most four files at once", async () => {
    for (const locale of ["fr", "es", "it", "nl", "pt-BR", "pl"]) {
      write(localePath(locale), {});
    }
    let active = 0;
    let peak = 0;
    const complete: Complete = async (params) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active--;
      return echo()(params);
    };
    await run({ repoRoot: tmp, complete, model });
    expect(peak).toBe(4);
  });

  it("filters by locale and file", async () => {
    write(localePath("fr"), {});
    write(join(localesDir(), "en/other.json"), { x: "X" });
    const onlyFr = await run({
      repoRoot: tmp,
      complete: echo(),
      model,
      locales: ["fr"],
      files: ["web/app"],
      dryRun: true,
    });
    expect(onlyFr.files.map((file) => file.path)).toEqual(["web/fr/app"]);
  });

  it("never writes under en", async () => {
    await run({ repoRoot: tmp, complete: echo(), model });
    expect(
      JSON.parse(readFileSync(join(localesDir(), "en/app.json"), "utf8")),
    ).toEqual({
      a: "Save",
      b: "Hi {name}",
    });
  });
});

describe("shouldFail", () => {
  const file = (translated: number, failed: number) => ({
    path: "p",
    translated,
    adopted: 0,
    removed: 0,
    failed: Array.from({ length: failed }, () => ({ key: "k", reason: "r" })),
  });
  it("fails only when every file with stale keys failed entirely", () => {
    expect(
      shouldFail({ model, files: [file(0, 1), file(0, 2), file(0, 0)] }),
    ).toBe(true);
    expect(shouldFail({ model, files: [file(0, 1), file(3, 0)] })).toBe(false);
    expect(shouldFail({ model, files: [file(2, 1)] })).toBe(false);
    expect(shouldFail({ model, files: [file(0, 0)] })).toBe(false);
  });
});

describe("formatReport", () => {
  it("renders a table and the failures", () => {
    const md = formatReport({
      model,
      files: [
        {
          path: "web/de/app",
          translated: 2,
          adopted: 1,
          removed: 0,
          failed: [{ key: "b", reason: "missing {name}" }],
        },
        {
          path: "web/fr/app",
          translated: 0,
          adopted: 0,
          removed: 0,
          failed: [{ key: "*", reason: "boom" }],
        },
        {
          path: "web/es/app",
          translated: 0,
          adopted: 0,
          removed: 0,
          failed: [],
        },
      ],
    });
    expect(md).toContain("| web/de/app | 2 | 1 | 0 |");
    expect(md).not.toContain("web/es/app");
    expect(md).toContain("Failed validation");
    expect(md).toContain("- `b`: `missing {name}`");
    expect(md).toContain("- Whole file failed: `boom`");
  });

  it("renders reasons as code so their markup is not interpreted", () => {
    const md = formatReport({
      model,
      files: [
        {
          path: "web/de/app",
          translated: 0,
          adopted: 0,
          removed: 0,
          failed: [
            { key: "a", reason: "tags differ: expected <b>, <a>, <br/>" },
            { key: "b", reason: "use `{name}` here" },
            { key: "c", reason: "`edge`" },
          ],
        },
      ],
    });
    expect(md).toContain("- `a`: `tags differ: expected <b>, <a>, <br/>`");
    expect(md).toContain("- `b`: ``use `{name}` here``");
    expect(md).toContain("- `c`: `` `edge` ``");
  });

  it("keeps the table and totals but truncates failures to fit GitHub's limit", () => {
    const files = Array.from({ length: 30 }, (_, i) => ({
      path: `web/l${i}/app`,
      translated: 1,
      adopted: 0,
      removed: 0,
      failed: Array.from({ length: 200 }, (_, j) => ({
        key: `key${j}`,
        reason: `placeholder {name} is missing from the translation <b>${j}</b>`,
      })),
    }));
    const md = formatReport({ model, files });
    expect(md.length).toBeLessThanOrEqual(60_000);
    expect(md.split("\n")[0]).toBe(`Model: ${model}`);
    for (const file of files)
      expect(md).toContain(`| ${file.path} | 1 | 0 | 0 |`);
    expect(md).toContain("| **Total** | **30** | **0** | **0** |");
    const shown = md.split("\n").filter((line) => line.startsWith("- ")).length;
    const omitted = Number(md.match(/_(\d+) more failures omitted/)?.[1]);
    expect(shown).toBeGreaterThan(0);
    expect(shown + omitted).toBe(6000);
    expect(md.trimEnd()).toMatch(/failures omitted[^\n]*$/);
  });
  const sample = {
    files: [
      { path: "web/de/app", translated: 2, adopted: 1, removed: 0, failed: [] },
      {
        path: "web/fr/app",
        translated: 5,
        adopted: 10,
        removed: 3,
        failed: [],
      },
    ],
  };

  it("names the model", () => {
    expect(formatReport({ model: "gpt-x", ...sample }).split("\n")[0]).toBe(
      "Model: gpt-x",
    );
  });

  it("totals translated, adopted and removed", () => {
    expect(formatReport({ model, ...sample })).toContain(
      "| **Total** | **7** | **11** | **3** |",
    );
  });

  it("says so when nothing changed", () => {
    expect(formatReport({ model, files: [] })).toContain(
      "No translation changes",
    );
  });
});
