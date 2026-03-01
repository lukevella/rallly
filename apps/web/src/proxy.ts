import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authLib } from "@/lib/auth";
import { getLocaleFromRequest, setLocaleCookie } from "@/lib/locale/server";
import { setPathname } from "@/lib/pathname";

const authRoutes = ["/login", "/register", "/forgot-password"];

export const proxy = async (req: NextRequest) => {
  const { nextUrl } = req;
  const newUrl = nextUrl.clone();
  const pathname = newUrl.pathname;

  if (authRoutes.some((route) => pathname.startsWith(route))) {
    let session = null;
    try {
      session = await authLib.api.getSession({
        headers: await headers(),
      });
    } catch {
      session = null;
    }

    if (session?.user && !session.user.isAnonymous) {
      newUrl.pathname = "/";
      return NextResponse.rewrite(newUrl);
    }
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
