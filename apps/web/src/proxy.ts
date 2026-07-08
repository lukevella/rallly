import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getLocaleFromRequest, setLocaleCookie } from "@/lib/locale/server";
import {
  hashBypassToken,
  isMaintenanceModeEnabled,
  isValidBypassCookie,
  isValidBypassToken,
  MAINTENANCE_BYPASS_COOKIE_MAX_AGE,
  MAINTENANCE_BYPASS_COOKIE_NAME,
  MAINTENANCE_PATH,
} from "@/lib/maintenance";
import { setPathname } from "@/lib/pathname";

async function handleMaintenance(req: NextRequest) {
  const { nextUrl } = req;

  if (nextUrl.pathname === MAINTENANCE_PATH) {
    const token = nextUrl.searchParams.get("token");
    if (token && (await isValidBypassToken({ token }))) {
      const res = NextResponse.redirect(new URL("/", nextUrl));
      res.cookies.set(
        MAINTENANCE_BYPASS_COOKIE_NAME,
        await hashBypassToken({ token }),
        {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: nextUrl.protocol === "https:",
          maxAge: MAINTENANCE_BYPASS_COOKIE_MAX_AGE,
        },
      );
      return res;
    }
    // Render the maintenance page via the locale rewrite below
    return null;
  }

  const bypass = req.cookies.get(MAINTENANCE_BYPASS_COOKIE_NAME)?.value;
  if (bypass && (await isValidBypassCookie({ value: bypass }))) {
    return null;
  }

  return NextResponse.redirect(new URL(MAINTENANCE_PATH, nextUrl));
}

export const proxy = async (req: NextRequest) => {
  const { nextUrl } = req;
  const newUrl = nextUrl.clone();
  const pathname = newUrl.pathname;

  if (isMaintenanceModeEnabled()) {
    const res = await handleMaintenance(req);
    if (res) {
      return res;
    }
  } else if (pathname === MAINTENANCE_PATH) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  const locale = getLocaleFromRequest(req);

  newUrl.pathname = `/${locale}${pathname}`;

  const res = NextResponse.rewrite(newUrl);

  setLocaleCookie(req, res, locale);

  res.headers.set("x-locale", locale);

  setPathname(req, res);

  return res;
};

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
