import languages, { defaultLocale } from "./index";
import Negotiator from "negotiator";
import { match } from "@formatjs/intl-localematcher";
import type { NextRequest } from "next/server";

const locales = Object.keys(languages);

export function getPreferredLocale(req: NextRequest) {
  const preferredLanguages = new Negotiator({
    headers: {
      "accept-language": req.headers.get("accept-language") ?? "",
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
