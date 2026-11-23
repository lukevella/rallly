import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { API_DOCS_URL } from "@/features/api-keys/constants";
import { setRefCookie } from "@/lib/acquisition";
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

// Email link scanners (Safe Links and similar) send HEAD to every link in an
// invite or notification email, in bursts. Rendering these pages for them
// opens a database connection per request for a response with no body.
const EMAIL_LINK_PATH = /^\/(?:invite|poll|unsubscribe)\/[^/]+\/?$/;

// The API host shares this deployment, so without this every app page would
// render there too. `/v1` and `/api` never reach the proxy (see the matcher),
// so whatever does is a path the API does not serve.
function handleApiHost(req: NextRequest) {
  const apiBaseUrl = process.env.API_BASE_URL;
  if (!apiBaseUrl) return null;
  const { nextUrl } = req;
  if (nextUrl.hostname !== new URL(apiBaseUrl).hostname) return null;

  if (nextUrl.pathname === "/") {
    return NextResponse.json({
      baseUrl: new URL("/v1", apiBaseUrl).href,
      docs: API_DOCS_URL,
    });
  }

  return NextResponse.json(
    {
      error: {
        code: "NOT_FOUND",
        message: `No route matches ${req.method} ${nextUrl.pathname}. See ${API_DOCS_URL}`,
      },
    },
    { status: 404 },
  );
}

export const proxy = async (req: NextRequest) => {
  const apiHostResponse = handleApiHost(req);
  if (apiHostResponse) {
    return apiHostResponse;
  }

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

  if (req.method === "HEAD" && EMAIL_LINK_PATH.test(pathname)) {
    return new NextResponse(null, { status: 200 });
  }

  const locale = getLocaleFromRequest(req);

  newUrl.pathname = `/${locale}${pathname}`;

  const res = NextResponse.rewrite(newUrl);

  setLocaleCookie(req, res, locale);

  setRefCookie(req, res);

  setPathname(req, res);

  return res;
};

// `/v1` is the public API on the API host: next.config rewrites it to
// `/api/v1`, and that rewrite only runs when this proxy does not claim the
// request first. Without the exclusion the locale rewrite sends it to the
// not-found route. `/z1tk88rw` is the Sentry tunnel (`tunnelRoute` in
// next.config.ts) and is excluded for the same reason.
export const config = {
  matcher: ["/((?!api|v1|z1tk88rw|_next/static|_next/image|static|.*\\.).*)"],
};
