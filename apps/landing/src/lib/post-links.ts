import { defaultLocale } from "@rallly/languages";

const siteOrigin = "https://rallly.co";
const unlocalizedPrefixes = ["/static/", "/api/"];
const postPathPattern = /^\/blog\/([^/?#]+)/;

function toSitePath(href: string) {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (!href.startsWith(siteOrigin)) return null;
  const rest = href.slice(siteOrigin.length);
  if (rest === "") return "/";
  return rest.startsWith("/") ? rest : null;
}

// Translated posts keep the English post's links, which would send a reader
// of the German post to the English pricing page.
export function localizePostHref({
  href,
  locale,
  isPostTranslated,
}: {
  href: string | undefined;
  locale: string;
  isPostTranslated: (slug: string) => boolean;
}) {
  if (!href || locale === defaultLocale) return href;

  const path = toSitePath(href);
  if (!path || unlocalizedPrefixes.some((prefix) => path.startsWith(prefix))) {
    return href;
  }

  const postSlug = postPathPattern.exec(path)?.[1];
  if (postSlug && !isPostTranslated(postSlug)) return href;

  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
