import languages from "@rallly/languages";
import languageParser from "accept-language-parser";
import { unsealData } from "iron-session/edge";
import { NextResponse } from "next/server";
import withAuth from "next-auth/middleware";

const supportedLocales = Object.keys(languages);

export default withAuth(
  async function middleware(req) {
    const { headers, nextUrl } = req;
    const newUrl = nextUrl.clone();

    // if the user is already logged in, don't let them access the login page
    if (
      /^\/(login|register)/.test(newUrl.pathname) &&
      req.nextauth.token?.email
    ) {
      newUrl.pathname = "/";
      return NextResponse.redirect(newUrl);
    }

    // Check if locale is specified in cookie
    const preferredLocale = req.nextauth.token?.locale;
    if (preferredLocale && supportedLocales.includes(preferredLocale)) {
      newUrl.pathname = `/${preferredLocale}${newUrl.pathname}`;
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
        }
      }
    }

    const res = NextResponse.rewrite(newUrl);

    if (!req.nextauth.token) {
      /**
       * We moved from a bespoke session implementation to next-auth.
       * This middleware looks for the old session cookie and moves it to
       * a temporary cookie accessible to the client which will exchange it
       * for a new session token with the legacy-token provider.
       */
      const legacyToken = req.cookies.get("rallly-session");
      if (legacyToken) {
        // delete old cookie
        res.cookies.delete("rallly-session");
        // make sure old cookie isn't expired
        const payload = await unsealData(legacyToken.value, {
          password: process.env.SECRET_PASSWORD,
        });
        // if it's not expired, write it to a new cookie that we
        // can read from the client
        if (Object.keys(payload).length > 0) {
          res.cookies.set({
            name: "legacy-token",
            value: legacyToken.value,
            httpOnly: false,
          });
        }
      }
    }

    return res;
  },
  {
    secret: process.env.SECRET_PASSWORD,
    callbacks: {
      authorized: () => true, // needs to be true to allow access to all pages
    },
  },
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
