import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import languages, { defaultLocale } from "./index";

const locales = Object.keys(languages);

export function getPreferredLocale({
  userLocale,
  acceptLanguageHeader,
}: {
  userLocale?: string;
  acceptLanguageHeader?: string;
}) {
  if (!acceptLanguageHeader || !userLocale) {
    return defaultLocale;
  }

  const preferredLanguages = new Negotiator({
    headers: {
      "accept-language": acceptLanguageHeader,
    },
  })
    .languages()
    .filter((lang) => lang !== "*");

  if (userLocale) {
    preferredLanguages.unshift(userLocale);
  }

  try {
    return match(preferredLanguages, locales, defaultLocale);
  } catch (e) {
    return defaultLocale;
  }
}
