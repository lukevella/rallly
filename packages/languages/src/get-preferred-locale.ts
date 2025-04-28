import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import languages, { defaultLocale } from "./index";

const locales = Object.keys(languages);

export function getPreferredLocale({
  acceptLanguageHeader,
}: {
  acceptLanguageHeader?: string;
}) {
  if (!acceptLanguageHeader) {
    return defaultLocale;
  }

  const preferredLanguages = new Negotiator({
    headers: {
      "accept-language": acceptLanguageHeader,
    },
  })
    .languages()
    .filter((lang) => lang !== "*");

  try {
    return match(preferredLanguages, locales, defaultLocale);
  } catch (e) {
    console.warn("Failed to match locale", e);
    return defaultLocale;
  }
}
