import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getLocaleFromRequest, setLocaleCookie } from "@/lib/locale/server";

export const middleware = async (req: NextRequest) => {
  const { nextUrl } = req;
  const newUrl = nextUrl.clone();
  const pathname = newUrl.pathname;

  const locale = getLocaleFromRequest(req);

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
