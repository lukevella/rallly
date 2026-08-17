import type { NextRequest } from "next/server";
import { i18nMiddleware } from "@/i18n/middleware";

export async function proxy(req: NextRequest) {
  return i18nMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|poll|.*\\.).*)"],
};
