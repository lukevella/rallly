import { describe, expect, it } from "vitest";
import { footerLinksSchema, isValidFooterLinkHref } from "./schema";

describe("isValidFooterLinkHref", () => {
  it("accepts absolute http and https urls", () => {
    expect(isValidFooterLinkHref("https://example.com/impressum")).toBe(true);
    expect(isValidFooterLinkHref("http://example.com")).toBe(true);
  });

  it("rejects relative paths — these links must resolve from emails too", () => {
    expect(isValidFooterLinkHref("/legal/privacy")).toBe(false);
    expect(isValidFooterLinkHref("/impressum?lang=de#kontakt")).toBe(false);
    expect(isValidFooterLinkHref("legal/privacy")).toBe(false);
  });

  it("rejects javascript urls", () => {
    expect(isValidFooterLinkHref("javascript:alert(1)")).toBe(false);
    expect(isValidFooterLinkHref("JavaScript:alert(1)")).toBe(false);
  });

  it("rejects javascript urls disguised with control characters", () => {
    expect(isValidFooterLinkHref("java\tscript:alert(1)")).toBe(false);
    expect(isValidFooterLinkHref("java\nscript:alert(1)")).toBe(false);
    expect(isValidFooterLinkHref(" javascript:alert(1)")).toBe(false);
  });

  it("rejects other non-http schemes", () => {
    expect(
      isValidFooterLinkHref("data:text/html,<script>alert(1)</script>"),
    ).toBe(false);
    expect(isValidFooterLinkHref("vbscript:msgbox(1)")).toBe(false);
    expect(isValidFooterLinkHref("file:///etc/passwd")).toBe(false);
    expect(isValidFooterLinkHref("mailto:legal@example.com")).toBe(false);
  });

  it("rejects scheme-relative urls that read as paths but leave the instance", () => {
    expect(isValidFooterLinkHref("//evil.example.com")).toBe(false);
  });

  it("keeps query strings and fragments on absolute urls", () => {
    expect(
      isValidFooterLinkHref("https://example.com/impressum?lang=de#kontakt"),
    ).toBe(true);
  });

  it("rejects bare hostnames, which are ambiguous rather than absolute", () => {
    expect(isValidFooterLinkHref("example.com/impressum")).toBe(false);
  });

  it("rejects empty and whitespace-only values", () => {
    expect(isValidFooterLinkHref("")).toBe(false);
    expect(isValidFooterLinkHref("   ")).toBe(false);
  });
});

describe("footerLinksSchema", () => {
  const link = { label: "Impressum", href: "https://example.com/impressum" };

  it("accepts an empty list", () => {
    expect(footerLinksSchema.parse({ footerLinks: [] }).footerLinks).toEqual(
      [],
    );
  });

  it("trims labels and hrefs", () => {
    const result = footerLinksSchema.parse({
      footerLinks: [
        { label: "  Impressum  ", href: "  https://example.com  " },
      ],
    });
    expect(result.footerLinks[0]).toEqual({
      label: "Impressum",
      href: "https://example.com",
    });
  });

  it("rejects a link with an empty label", () => {
    expect(
      footerLinksSchema.safeParse({ footerLinks: [{ ...link, label: "  " }] })
        .success,
    ).toBe(false);
  });

  it("rejects a link with an unsafe href", () => {
    expect(
      footerLinksSchema.safeParse({
        footerLinks: [{ ...link, href: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
  });

  it("caps the number of links", () => {
    expect(
      footerLinksSchema.safeParse({
        footerLinks: Array.from({ length: 6 }, () => link),
      }).success,
    ).toBe(false);
  });

  it("caps label length", () => {
    expect(
      footerLinksSchema.safeParse({
        footerLinks: [{ ...link, label: "x".repeat(41) }],
      }).success,
    ).toBe(false);
  });
});
