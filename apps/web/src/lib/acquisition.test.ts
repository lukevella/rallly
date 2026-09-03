import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it } from "vitest";

import {
  CTA_COOKIE_NAME,
  parseCtaParam,
  REF_COOKIE_NAME,
  setRefCookie,
} from "./acquisition";

describe("parseCtaParam", () => {
  it.each([
    "pricing_free",
    "pricing_pro",
    "header",
    "mobile_menu_login",
    "a1",
  ])("accepts cta id %s", (value) => {
    expect(parseCtaParam(value)).toBe(value);
  });

  // Visitor-controlled, so anything that isn't a flat snake_case id must be
  // dropped before it reaches analytics as a property value.
  it.each([
    "",
    "Pricing_Pro",
    "pricing-pro",
    "pricing/pro",
    "_pricing",
    "pricing pro",
    "<script>",
    "a".repeat(65),
  ])("rejects %s", (value) => {
    expect(parseCtaParam(value)).toBeUndefined();
  });

  it("rejects missing values", () => {
    expect(parseCtaParam(undefined)).toBeUndefined();
    expect(parseCtaParam(null)).toBeUndefined();
  });
});

const setCookies = (url: string) => {
  const req = new NextRequest(new URL(url));
  const res = NextResponse.next();
  setRefCookie(req, res);
  return res.cookies;
};

describe("setRefCookie", () => {
  it("persists both ref and cta", () => {
    const cookies = setCookies(
      "https://app.rallly.co/?ref=pricing&cta=pricing_pro",
    );
    expect(cookies.get(REF_COOKIE_NAME)?.value).toBe("pricing");
    expect(cookies.get(CTA_COOKIE_NAME)?.value).toBe("pricing_pro");
  });

  it("keeps ref but stores no cta when cta is invalid", () => {
    const cookies = setCookies("https://app.rallly.co/?ref=pricing&cta=NOPE");
    expect(cookies.get(REF_COOKIE_NAME)?.value).toBe("pricing");
    // Rejected values take the clear path, so nothing bogus is ever persisted.
    expect(cookies.get(CTA_COOKIE_NAME)?.value).toBe("");
  });

  it("ignores cta without a ref", () => {
    const cookies = setCookies("https://app.rallly.co/?cta=pricing_pro");
    expect(cookies.getAll()).toHaveLength(0);
  });

  // A later ref-only click must not inherit the previous click's cta, or the
  // pair would describe two different visits.
  it("clears a stale cta when the new ref carries none", () => {
    const cookies = setCookies("https://app.rallly.co/?ref=home");
    const cta = cookies.get(CTA_COOKIE_NAME);
    expect(cta?.value).toBe("");
    expect(cta?.expires).toEqual(new Date(0));
  });
});
