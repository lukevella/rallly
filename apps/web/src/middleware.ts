import { sessionConfig } from "@rallly/backend/session/config";
import languageParser from "accept-language-parser";
import { getIronSession } from "iron-session/edge";
import { NextRequest, NextResponse } from "next/server";

// Generate a unique ID with the specified number of bytes
function generateUniqueId() {
  return crypto.randomUUID();
}

const supportedLocales = [
  "ca",
  "cs",
  "da",
  "de",
  "en",
  "es",
  "fi",
  "fr",
  "hu",
  "hr",
  "it",
  "ko",
  "nl",
  "pl",
  "pt",
  "pt-BR",
  "ru",
  "sk",
  "sv",
  "vi",
  "zh",
];

export async function middleware(req: NextRequest) {
  const { headers, cookies, nextUrl } = req;
  const newUrl = nextUrl.clone();
  const res = NextResponse.next();

  const session = await getIronSession(req, res, sessionConfig);

  if (!session.user) {
    session.user = {
      id: `user-${generateUniqueId()}`,
      isGuest: true,
    };
    await session.save();
  }

  // Check if locale is specified in cookie
  const localeCookie = cookies.get("NEXT_LOCALE");
  if (localeCookie && supportedLocales.includes(localeCookie.value)) {
    newUrl.pathname = `/${localeCookie.value}${newUrl.pathname}`;
    return NextResponse.rewrite(newUrl);
  } else {
    // Check if locale is specified in header
    const acceptLanguageHeader = headers.get("accept-language");

    if (acceptLanguageHeader) {
      const locale = languageParser.pick(
        supportedLocales,
        acceptLanguageHeader,
      );

      if (locale) {
        newUrl.pathname = `/${locale}${newUrl.pathname}`;
        return NextResponse.rewrite(newUrl);
      }
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:id*", "/demo", "/p/:id*", "/profile", "/new", "/login"],
};
