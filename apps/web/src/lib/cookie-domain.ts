import * as z from "zod";

export const cookieDomainSchema = z
  .string()
  .regex(/^\.?[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*$/, {
    message:
      "must be a hostname or optional leading-dot domain (no protocol/port/path)",
  })
  .refine(
    (value) => {
      // Browsers ignore the Domain attribute for dotless hostnames and IP
      // addresses (RFC 6265bis public suffix handling) and store the cookie
      // host-only instead. The session cookie then shares a store key with
      // hostOnlyCookieCleanup's host-only deletions, so every sign-in
      // deletes the session it just set.
      const host = value.replace(/^\./, "");
      return host.includes(".") && !/^\d+(\.\d+)*$/.test(host);
    },
    {
      message:
        "cannot be localhost, a single-label hostname, or an IP address. Browsers ignore the Domain attribute for these hosts, which breaks sign-in. Unset it to scope cookies to the request host instead.",
    },
  );
