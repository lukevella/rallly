import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPostsApi } from "./api";

let dir: string;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "posts-"));
  fs.mkdirSync(path.join(dir, "de"));
  fs.mkdirSync(path.join(dir, "fr"));
  fs.writeFileSync(
    path.join(dir, "a.md"),
    "---\ntitle: English\ndate: 2026-01-01\n---\nBody\n",
  );
  fs.writeFileSync(
    path.join(dir, "de", "orphan.md"),
    "---\ntitle: Waise\ndate: 2026-01-01\n---\nKörper\n",
  );
  fs.writeFileSync(
    path.join(dir, "de", "a.md"),
    "---\ntitle: Deutsch\ndate: 2026-01-01\n---\nKörper\n",
  );
});

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("posts api", () => {
  it("ignores locale directories", () => {
    expect(createPostsApi(dir).getPostSlugs()).toEqual(["a"]);
  });

  it("reads the translation", () => {
    const post = createPostsApi(dir).getPostBySlug(
      "a",
      ["title", "contentLocale"],
      "de",
    );
    expect(post).toMatchObject({ title: "Deutsch", contentLocale: "de" });
  });

  it("falls back to English", () => {
    const api = createPostsApi(dir);
    for (const locale of ["fr", "en-GB", "en", "../de", "de/x"]) {
      expect(
        api.getPostBySlug("a", ["title", "contentLocale"], locale),
      ).toMatchObject({ title: "English", contentLocale: "en" });
    }
  });

  it("returns null when only a translation exists", () => {
    const api = createPostsApi(dir);
    expect(api.getPostBySlug("orphan", ["title"], "de")).toBeNull();
    expect(api.getPostLocales("orphan")).toEqual([]);
  });

  it("lists translated locales", () => {
    expect(createPostsApi(dir).getPostLocales("a")).toEqual(["de"]);
  });

  it("translates every post in getAllPosts", () => {
    const posts = createPostsApi(dir).getAllPosts(["slug", "title"], "de");
    expect(posts).toEqual([{ slug: "a", title: "Deutsch" }]);
  });
});
