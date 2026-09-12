import {
  FREEMAIL_DOMAINS,
  NONPROFIT_SITE_TEXT_MAX_CHARS,
} from "@/features/billing/nonprofit/constants";

export function isFreemailDomain(domain: string) {
  return FREEMAIL_DOMAINS.has(domain.trim().toLowerCase());
}

const IPV4_LITERAL = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * Canonical https origin for a user supplied website, or null when the input
 * is not something we are willing to fetch: only https on the default port,
 * a real hostname (no IP literals, no localhost, no single label), no
 * credentials.
 */
export function normalizeWebsite(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port) return null;

  const host = url.hostname;
  if (!host.includes(".")) return null;
  if (host.startsWith("[") || IPV4_LITERAL.test(host)) return null;
  if (host === "localhost" || host.endsWith(".localhost")) return null;

  return `https://${host}`;
}

function stripWww(host: string) {
  return host.toLowerCase().replace(/^www\./, "");
}

/**
 * Same registrable organization: equal after stripping `www.`, or one is a
 * subdomain of the other. Sharing a public suffix (`foo.co.uk` / `bar.co.uk`)
 * is not a match.
 */
export function domainsMatch(emailDomain: string, websiteHost: string) {
  const a = stripWww(emailDomain);
  const b = stripWww(websiteHost);
  if (!a || !b) return false;
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

export function htmlToText(html: string) {
  const text = html
    .replace(/<(script|style|noscript|template|svg)[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > NONPROFIT_SITE_TEXT_MAX_CHARS
    ? text.slice(0, NONPROFIT_SITE_TEXT_MAX_CHARS)
    : text;
}
