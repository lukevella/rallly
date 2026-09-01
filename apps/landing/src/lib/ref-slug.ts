import { languages } from "@/i18n/settings";

// Cross-domain referrers don't survive the hop from rallly.co to the app, so
// CTA links carry the originating page as a ?ref=<slug> query param instead.
// The slug is always a locale-independent page path — never personal data.
export function getRefSlug(pathname: string) {
  let path = pathname;
  const locale = languages.find(
    (lng) => path === `/${lng}` || path.startsWith(`/${lng}/`),
  );
  if (locale) {
    path = path.slice(locale.length + 1) || "/";
  }
  const slug = path.replace(/^\/+|\/+$/g, "");
  return slug === "" ? "home" : slug;
}
