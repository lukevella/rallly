import languages from "@rallly/languages";
import languageParser from "accept-language-parser";
import type { NextRequest } from "next/server";

const supportedLocales = Object.keys(languages);

export async function getLocaleFromHeader(req: NextRequest) {
  // Check if locale is specified in header
  const headers = req.headers;
  const acceptLanguageHeader = headers.get("accept-language");
  const localeFromHeader = acceptLanguageHeader
    ? languageParser.pick(supportedLocales, acceptLanguageHeader)
    : null;
  return localeFromHeader ?? "en";
}
