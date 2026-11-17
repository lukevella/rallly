import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import matter from "gray-matter";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hashSource } from "./lock.ts";
import { listPosts, planPosts, runPosts } from "./posts.ts";
import type { Glossary } from "./prompt.ts";
import type { Complete } from "./translator.ts";

const glossary: Glossary = { doNotTranslate: [], terms: [] };
const model = "test/model";

let tmp: string;
let calls: { title: string }[];

const post = (title: string) => `---
title: ${title}
date: 2026-01-02
category: guides
excerpt: About ${title}.
---

## Heading

Visit [pricing](https://rallly.co/pricing) now.
`;

const en = (slug: string) => join(tmp, "apps/landing/src/posts", `${slug}.md`);
const tr = (locale: string, slug: string) =>
  join(tmp, "apps/landing/src/posts", locale, `${slug}.md`);
const lockFile = (locale: string) =>
  join(tmp, "i18n/lock/posts", `${locale}.json`);

const put = (path: string, text: string) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};
const readLock = (locale: string) =>
  JSON.parse(readFileSync(lockFile(locale), "utf8"));

const translator =
  (failFor?: string): Complete =>
  async (params) => {
    const messages = (params as { messages: { content: string }[] }).messages;
    const user = JSON.parse(messages[messages.length - 1]?.content ?? "{}");
    calls.push({ title: user.title });
    if (failFor && user.title === failFor) throw new Error("boom");
    return {
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: `[de] ${user.title}`,
              excerpt: `[de] ${user.excerpt}`,
              body: user.body,
            }),
          },
          finish_reason: "stop",
        },
      ],
    };
  };

const go = (options: { complete?: Complete; dryRun?: boolean } = {}) =>
  runPosts({
    repoRoot: tmp,
    complete: options.complete ?? translator(),
    model,
    glossary,
    dryRun: options.dryRun ?? false,
  });

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "translations-posts-"));
  calls = [];
  mkdirSync(join(tmp, "apps/landing/public/locales/en"), { recursive: true });
  mkdirSync(join(tmp, "apps/landing/public/locales/de"), { recursive: true });
  put(en("alpha"), post("Alpha"));
  put(en("beta"), post("Beta"));
});

afterEach(() => rmSync(tmp, { recursive: true, force: true }));

describe("runPosts", () => {
  it("translates every post for every locale", async () => {
    const report = await go();
    expect(report).toEqual([
      { path: "posts/de", translated: 2, adopted: 0, removed: 0, failed: [] },
    ]);
    expect(matter(readFileSync(tr("de", "alpha"), "utf8")).data.title).toBe(
      "[de] Alpha",
    );
    expect(existsSync(tr("de", "beta"))).toBe(true);
    expect(readLock("de")).toEqual({
      alpha: hashSource(post("Alpha")),
      beta: hashSource(post("Beta")),
    });
    expect(readFileSync(lockFile("de"), "utf8").endsWith("}\n")).toBe(true);
  });

  it("skips current translations", async () => {
    await go();
    calls = [];
    const report = await go();
    expect(calls).toHaveLength(0);
    expect(report[0]?.translated).toBe(0);
  });

  it("retranslates a post whose English changed", async () => {
    await go();
    calls = [];
    put(en("beta"), post("Beta v2"));
    await go();
    expect(calls).toEqual([{ title: "Beta v2" }]);
    expect(readLock("de").beta).toBe(hashSource(post("Beta v2")));
  });

  it("keeps the old lock entry when writing a translation fails", async () => {
    await go();
    const oldHash = readLock("de").beta;
    put(en("beta"), post("Beta v2"));
    chmodSync(tr("de", "beta"), 0o444);
    const [report] = await go();
    chmodSync(tr("de", "beta"), 0o644);
    expect(readLock("de").beta).toBe(oldHash);
    expect(report?.failed.map((f) => f.key)).toContain("beta");
  });

  it("adopts a valid hand-written translation without a lock entry", async () => {
    const handwritten = post("Alpha").replace("Heading", "Überschrift");
    put(tr("de", "alpha"), handwritten);
    await go({ complete: translator("Beta") });
    expect(calls.map((call) => call.title)).toEqual(["Beta"]);
    expect(readFileSync(tr("de", "alpha"), "utf8")).toBe(handwritten);
    expect(readLock("de").alpha).toBe(hashSource(post("Alpha")));
  });

  it("retranslates an invalid translation", async () => {
    await go();
    calls = [];
    const broken = readFileSync(tr("de", "alpha"), "utf8").replace(
      "https://rallly.co/pricing",
      "https://example.com",
    );
    writeFileSync(tr("de", "alpha"), broken);
    await go();
    expect(calls).toEqual([{ title: "Alpha" }]);
    expect(readFileSync(tr("de", "alpha"), "utf8")).toContain(
      "https://rallly.co/pricing",
    );
  });

  it("deletes translations of a removed post", async () => {
    await go();
    rmSync(en("beta"));
    const report = await go();
    expect(report[0]?.removed).toBe(1);
    expect(existsSync(tr("de", "beta"))).toBe(false);
    expect(readLock("de")).toEqual({ alpha: hashSource(post("Alpha")) });
    expect(existsSync(en("alpha"))).toBe(true);
  });

  it("keeps going when one post fails", async () => {
    const report = await go({ complete: translator("Alpha") });
    expect(report[0]?.translated).toBe(1);
    expect(report[0]?.failed).toEqual([{ key: "alpha", reason: "boom" }]);
    expect(existsSync(tr("de", "beta"))).toBe(true);
    expect(readLock("de")).toEqual({ beta: hashSource(post("Beta")) });
  });

  it("writes nothing on dry run", async () => {
    await go({ dryRun: true });
    expect(existsSync(join(tmp, "apps/landing/src/posts/de"))).toBe(false);
    expect(existsSync(join(tmp, "i18n/lock/posts"))).toBe(false);
  });

  it("reports an unreadable lock as a failed locale and continues", async () => {
    mkdirSync(join(tmp, "apps/landing/public/locales/fr"), { recursive: true });
    put(lockFile("de"), "{nope");
    const report = await go();
    expect(report[0]?.failed[0]?.key).toBe("*");
    expect(report[1]).toMatchObject({ path: "posts/fr", translated: 2 });
  });

  it("never deletes outside the locale directory", async () => {
    await go();
    put(lockFile("de"), JSON.stringify({ ...readLock("de"), "../alpha": "x" }));
    const report = await go();
    expect(report[0]?.removed).toBe(0);
    expect(existsSync(en("alpha"))).toBe(true);
    expect(readLock("de")).not.toHaveProperty("../alpha");
  });

  it("writes nothing when the posts directory is missing", async () => {
    rmSync(join(tmp, "apps/landing/src/posts"), { recursive: true });
    expect(await go()).toEqual([]);
    expect(existsSync(join(tmp, "i18n"))).toBe(false);
  });

  it("sorts failures by slug", async () => {
    const complete: Complete = async () => {
      throw new Error("boom");
    };
    const report = await go({ complete });
    expect(report[0]?.failed.map((f) => f.key)).toEqual(["alpha", "beta"]);
  });

  it("passes the outdated translation as previous", async () => {
    await go();
    const seen: unknown[] = [];
    const complete: Complete = async (params) => {
      const messages = (params as { messages: { content: string }[] }).messages;
      seen.push(JSON.parse(messages[messages.length - 1]?.content ?? "{}"));
      return translator()(params);
    };
    put(en("alpha"), post("Alpha v2"));
    await go({ complete });
    expect(seen).toHaveLength(1);
    expect((seen[0] as { previous: string }).previous).toContain("[de] Alpha");
  });

  it("honours the locales filter", async () => {
    mkdirSync(join(tmp, "apps/landing/public/locales/fr"), { recursive: true });
    const report = await runPosts({
      repoRoot: tmp,
      complete: translator(),
      model,
      glossary,
      locales: ["fr"],
    });
    expect(report.map((r) => r.path)).toEqual(["posts/fr"]);
    expect(existsSync(tr("de", "alpha"))).toBe(false);
  });

  it("does nothing when posts or locales are missing", async () => {
    rmSync(join(tmp, "apps/landing"), { recursive: true });
    expect(await go()).toEqual([]);
    expect(listPosts({ repoRoot: tmp })).toEqual([]);
  });
});

describe("planPosts", () => {
  it("lists top-level posts only", () => {
    put(tr("de", "alpha"), post("Alpha"));
    expect(listPosts({ repoRoot: tmp })).toEqual(["alpha", "beta"]);
    expect(planPosts({ repoRoot: tmp, locale: "de" }).adopt).toEqual(["alpha"]);
  });
});
