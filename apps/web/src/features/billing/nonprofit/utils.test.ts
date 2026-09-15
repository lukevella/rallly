import { describe, expect, it } from "vitest";
import { NONPROFIT_SITE_TEXT_MAX_CHARS } from "./constants";
import {
  buildCheckoutDiscountParams,
  domainsMatch,
  htmlToText,
  isFreemailDomain,
  normalizeWebsite,
} from "./utils";

describe("isFreemailDomain", () => {
  it("matches consumer providers regardless of case", () => {
    expect(isFreemailDomain("gmail.com")).toBe(true);
    expect(isFreemailDomain("Outlook.com")).toBe(true);
    expect(isFreemailDomain(" pm.me ")).toBe(true);
  });

  it("does not match organization domains or lookalikes", () => {
    expect(isFreemailDomain("redcross.org.uk")).toBe(false);
    expect(isFreemailDomain("mail.gmail.com")).toBe(false);
    expect(isFreemailDomain("gmail.com.example.org")).toBe(false);
  });
});

describe("normalizeWebsite", () => {
  it("returns the https origin", () => {
    expect(normalizeWebsite("https://www.example.org/about?x=1#top")).toBe(
      "https://www.example.org",
    );
    expect(normalizeWebsite("Example.ORG")).toBe("https://example.org");
    expect(normalizeWebsite("  example.org/path ")).toBe("https://example.org");
  });

  it("rejects anything that is not plain https", () => {
    expect(normalizeWebsite("http://example.org")).toBeNull();
    expect(normalizeWebsite("ftp://example.org")).toBeNull();
    expect(normalizeWebsite("https://example.org:8443")).toBeNull();
    expect(normalizeWebsite("https://user:pass@example.org")).toBeNull();
    expect(normalizeWebsite("https://user@example.org")).toBeNull();
  });

  it("rejects hosts that are not public hostnames", () => {
    expect(normalizeWebsite("https://127.0.0.1")).toBeNull();
    expect(normalizeWebsite("https://10.0.0.1")).toBeNull();
    expect(normalizeWebsite("https://[::1]")).toBeNull();
    expect(normalizeWebsite("https://localhost")).toBeNull();
    expect(normalizeWebsite("https://app.localhost")).toBeNull();
    expect(normalizeWebsite("https://intranet")).toBeNull();
    expect(normalizeWebsite("")).toBeNull();
    expect(normalizeWebsite("not a url")).toBeNull();
  });
});

describe("domainsMatch", () => {
  it("matches equal hosts ignoring www and case", () => {
    expect(domainsMatch("example.org", "example.org")).toBe(true);
    expect(domainsMatch("example.org", "www.example.org")).toBe(true);
    expect(domainsMatch("WWW.Example.org", "example.ORG")).toBe(true);
  });

  it("matches when one is a subdomain of the other", () => {
    expect(domainsMatch("mail.example.org", "example.org")).toBe(true);
    expect(domainsMatch("example.org", "shop.example.org")).toBe(true);
    expect(domainsMatch("staff.example.org", "www.example.org")).toBe(true);
  });

  it("does not match a shared public suffix or a lookalike", () => {
    expect(domainsMatch("foo.co.uk", "bar.co.uk")).toBe(false);
    expect(domainsMatch("example.org", "notexample.org")).toBe(false);
    expect(domainsMatch("example.org", "example.org.evil.com")).toBe(false);
    expect(domainsMatch("example.com", "example.org")).toBe(false);
  });

  it("never matches an empty side", () => {
    expect(domainsMatch("", "example.org")).toBe(false);
    expect(domainsMatch("www.", "example.org")).toBe(false);
  });
});

describe("htmlToText", () => {
  it("strips tags, scripts, styles and comments and collapses whitespace", () => {
    const html = `<html><head><title>Charity</title><style>p{color:red}</style>
      <script>alert("x")</script></head>
      <body><!-- hidden --><h1>Save   the\n\nWhales</h1><p>Registered&nbsp;charity &amp; more</p>
      <noscript>enable js</noscript></body></html>`;

    expect(htmlToText(html)).toBe(
      "Charity Save the Whales Registered charity & more",
    );
  });

  it("caps the output", () => {
    const html = `<p>${"a".repeat(NONPROFIT_SITE_TEXT_MAX_CHARS * 2)}</p>`;
    expect(htmlToText(html)).toHaveLength(NONPROFIT_SITE_TEXT_MAX_CHARS);
  });
});

describe("buildCheckoutDiscountParams", () => {
  it("attaches the coupon and drops promotion codes for an entitled space", () => {
    expect(buildCheckoutDiscountParams("nonprofit-20")).toEqual({
      session: { discounts: [{ coupon: "nonprofit-20" }] },
      recovery: { allow_promotion_codes: false },
    });
  });

  it("keeps promotion codes and no discount otherwise", () => {
    const params = buildCheckoutDiscountParams(null);
    expect(params.session).toEqual({ allow_promotion_codes: true });
    expect(params.session).not.toHaveProperty("discounts");
    expect(params.recovery).toEqual({ allow_promotion_codes: true });
  });
});
