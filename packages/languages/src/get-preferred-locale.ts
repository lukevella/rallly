import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { defaultLocale, supportedLngs } from "./index";

/**
 * The full language tags from an Accept-Language header (e.g. "en-GB"),
 * most preferred first.
 */
export function getPreferredLanguagesFromHeaders({
  acceptLanguageHeader,
}: {
  acceptLanguageHeader: string;
}) {
  return new Negotiator({
    headers: {
      "accept-language": acceptLanguageHeader,
    },
  })
    .languages()
    .filter((lang) => lang !== "*");
}

function isRussianTag(tag: string) {
  return tag.split("-")[0]?.toLowerCase() === "ru";
}

export function getPreferredLocaleFromHeaders({
  acceptLanguageHeader,
}: {
  acceptLanguageHeader: string;
}) {
  const preferredLanguages = getPreferredLanguagesFromHeaders({
    acceptLanguageHeader,
  });

  try {
    const locale = match(preferredLanguages, supportedLngs, defaultLocale);
    // CLDR language distance maps Ukrainian, Belarusian, Kazakh and other
    // languages of the former Soviet Union to Russian. Only serve Russian to
    // visitors who ask for it.
    if (locale === "ru" && !preferredLanguages.some(isRussianTag)) {
      return match(
        preferredLanguages,
        supportedLngs.filter((lng) => lng !== "ru"),
        defaultLocale,
      );
    }
    return locale;
  } catch (_error) {
    return defaultLocale;
  }
}

/**
 * @deprecated Use getPreferredLocaleFromHeaders instead
 */
export function getPreferredLocale({
  userLocale,
  acceptLanguageHeader,
}: {
  userLocale?: string;
  acceptLanguageHeader?: string;
}) {
  if (userLocale && supportedLngs.includes(userLocale)) {
    return userLocale;
  }

  if (!acceptLanguageHeader) {
    return defaultLocale;
  }

  return getPreferredLocaleFromHeaders({
    acceptLanguageHeader,
  });
}
