import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authLib } from "@/lib/auth";
import { getLocaleFromRequest, setLocaleCookie } from "@/lib/locale/server";

export const proxy = async (req: NextRequest) => {
  const { nextUrl } = req;
  const newUrl = nextUrl.clone();
  const pathname = newUrl.pathname;

  const locale = getLocaleFromRequest(req);

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    const session = await authLib.api.getSession({
      headers: await headers(),
    });
    if (session?.user && !session.user.isAnonymous) {
      const redirectTo = newUrl.searchParams.get("redirectTo") ?? "/";
      return NextResponse.redirect(new URL(redirectTo, newUrl.origin));
    }
  }

  newUrl.pathname = `/${locale}${pathname}`;

  const res = NextResponse.rewrite(newUrl);

  setLocaleCookie(req, res, locale);

  res.headers.set("x-locale", locale);
  res.headers.set("x-pathname", pathname);

  return res;
};

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
