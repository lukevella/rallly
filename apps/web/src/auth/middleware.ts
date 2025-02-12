import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import NextAuth from "next-auth";

import { nextAuthConfig } from "@/next-auth.config";

const { auth } = NextAuth(nextAuthConfig);

export function withAuth(
  middleware: (req: NextAuthRequest) => Promise<NextResponse>,
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const res = await auth(middleware)(req, undefined as never);
    if (res) {
      return new NextResponse(res.body, {
        status: res.status,
        headers: res.headers,
        url: res.url,
        statusText: res.statusText,
      });
    }
    return NextResponse.next();
  };
}
