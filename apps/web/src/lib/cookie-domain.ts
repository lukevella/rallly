import { getDomain } from "tldts";
import * as z from "zod";

export const cookieDomainSchema = z
  .string()
  .regex(/^\.?[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*$/, {
    message:
      "must be a hostname or optional leading-dot domain (no protocol/port/path)",
  })
  .refine(
    (value) => {
      // Browsers only honor a Domain attribute naming a registrable domain.
      // For anything else (localhost, single-label hostnames, IP addresses,
      // public suffixes like co.uk or vercel.app) the cookie is either
      // dropped or silently stored host-only, where it shares a store key
      // with hostOnlyCookieCleanup's host-only deletions, so every sign-in
      // deletes the session it just set. getDomain returns null for exactly
      // this class; unlisted TLDs (intranet domains) still resolve.
      const host = value.replace(/^\./, "");
      return getDomain(host, { allowPrivateDomains: true }) !== null;
    },
    {
      message:
        "must be a registrable domain. Browsers ignore a Domain attribute naming localhost, an IP address, a single-label hostname, or a public suffix (like .com or .vercel.app), which breaks sign-in. Unset it to scope cookies to the request host instead.",
    },
  );
