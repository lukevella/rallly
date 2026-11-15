import { describe, expect, it } from "vitest";
import {
  isHomePath,
  notFoundMarkdown,
  prefersMarkdown,
} from "./markdown-negotiation";

describe("prefersMarkdown", () => {
  it("is true when only Markdown is accepted", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
  });

  it("is true when Markdown outranks HTML", () => {
    expect(prefersMarkdown("text/html;q=0.5, text/markdown")).toBe(true);
    expect(prefersMarkdown("text/markdown, text/html;q=0.9, */*;q=0.1")).toBe(
      true,
    );
  });

  it("is false for browsers and missing headers", () => {
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown("*/*")).toBe(false);
    expect(
      prefersMarkdown(
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      ),
    ).toBe(false);
  });

  it("is false when HTML outranks Markdown or Markdown is refused", () => {
    expect(prefersMarkdown("text/html, text/markdown;q=0.5")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=0")).toBe(false);
    expect(prefersMarkdown("text/markdown;Q=0, text/html;q=0")).toBe(false);
  });

  it("ranks text/html by the most specific matching wildcard", () => {
    expect(prefersMarkdown("text/markdown;q=0.5, text/*")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=0.5, */*")).toBe(false);
    expect(prefersMarkdown("text/markdown, */*;q=0.8")).toBe(true);
    expect(prefersMarkdown("text/markdown;q=0.5, text/*;q=0.4, */*")).toBe(
      true,
    );
  });
});

describe("isHomePath", () => {
  it("matches the root and locale roots", () => {
    expect(isHomePath("/")).toBe(true);
    expect(isHomePath("/de")).toBe(true);
    expect(isHomePath("/de/")).toBe(true);
  });

  it("does not match other pages", () => {
    expect(isHomePath("/pricing")).toBe(false);
    expect(isHomePath("/de/pricing")).toBe(false);
    expect(isHomePath("/xx")).toBe(false);
  });
});

describe("notFoundMarkdown", () => {
  it("explains the error and links to the site index", () => {
    const body = notFoundMarkdown("https://rallly.co");
    expect(body).toMatch(/^# Page not found/);
    expect(body).toContain("(https://rallly.co/llms.txt)");
    expect(body).toContain("(https://rallly.co/sitemap.xml)");
  });
});
