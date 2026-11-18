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

export function getPreferredLocaleFromHeaders({
  acceptLanguageHeader,
}: {
  acceptLanguageHeader: string;
}) {
  const preferredLanguages = getPreferredLanguagesFromHeaders({
    acceptLanguageHeader,
  });

  try {
    return match(preferredLanguages, supportedLngs, defaultLocale);
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
