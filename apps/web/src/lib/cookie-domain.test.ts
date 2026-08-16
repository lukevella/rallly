import { describe, expect, it } from "vitest";

import { cookieDomainSchema } from "./cookie-domain";

describe("cookieDomainSchema", () => {
  it.each([
    ".rallly.co",
    "rallly.example.com",
    ".rallly.example.com",
    "example.com",
  ])("accepts registrable domain %s", (value) => {
    expect(cookieDomainSchema.safeParse(value).success).toBe(true);
  });

  it.each([
    "https://example.com",
    "example.com:3000",
    "example.com/path",
  ])("rejects non-hostname %s", (value) => {
    expect(cookieDomainSchema.safeParse(value).success).toBe(false);
  });

  // Browsers refuse to create a domain cookie for these hosts and silently
  // store the cookie host-only instead (RFC 6265bis public suffix handling).
  // The session cookie then collides with hostOnlyCookieCleanup's host-only
  // deletions and every sign-in destroys its own session.
  it.each([
    "localhost",
    ".localhost",
    "intranet-host",
  ])("rejects dotless hostname %s", (value) => {
    expect(cookieDomainSchema.safeParse(value).success).toBe(false);
  });

  it.each([
    "127.0.0.1",
    "192.168.1.10",
    ".127.0.0.1",
  ])("rejects IP address %s", (value) => {
    expect(cookieDomainSchema.safeParse(value).success).toBe(false);
  });

  // Browsers also refuse to set a cookie whose Domain is a public suffix:
  // ignored entirely when it differs from the request host, downgraded to
  // host-only when it matches. The private section counts too, so a site on
  // foo.vercel.app cannot share cookies via Domain=.vercel.app.
  it.each([
    ".com",
    "co.uk",
    ".co.uk",
    "vercel.app",
  ])("rejects public suffix %s", (value) => {
    expect(cookieDomainSchema.safeParse(value).success).toBe(false);
  });

  // Dotted domains under an unlisted TLD (intranet setups) stay valid.
  it("accepts a dotted intranet domain", () => {
    expect(cookieDomainSchema.safeParse(".rallly.corp.internal").success).toBe(
      true,
    );
  });
});
