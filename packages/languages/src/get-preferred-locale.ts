import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { defaultLocale, supportedLngs } from "./index";

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

  const preferredLanguages = new Negotiator({
    headers: {
      "accept-language": acceptLanguageHeader,
    },
  })
    .languages()
    .filter((lang) => lang !== "*");

  try {
    return match(preferredLanguages, supportedLngs, defaultLocale);
  } catch (_error) {
    return defaultLocale;
  }
}
