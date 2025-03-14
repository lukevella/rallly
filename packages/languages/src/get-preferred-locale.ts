import languages, { defaultLocale } from "./index";
import Negotiator from "negotiator";
import { match } from "@formatjs/intl-localematcher";
import type { NextRequest } from "next/server";

const locales = Object.keys(languages);

export async function getPreferredLocale(req: NextRequest) {
  const preferredLanguages = new Negotiator({
    headers: {
      "accept-language": req.headers.get("accept-language") ?? undefined,
    },
  }).languages();

  const locale = match(preferredLanguages, locales, defaultLocale);
  return locale;
}
