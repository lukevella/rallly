import { prisma } from "@rallly/database";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getServerSession } from "@/auth";
import { decryptToken } from "@/utils/session";

type EmailChangePayload = {
  fromEmail: string;
  toEmail: string;
};

const COOKIE_CONFIG = {
  path: "/",
  httpOnly: false,
  secure: false,
  expires: new Date(Date.now() + 5 * 1000), // 5 seconds
} as const;

const setEmailChangeCookie = (
  type: "success" | "error",
  value: string = "1",
) => {
  cookies().set(`email-change-${type}`, value, COOKIE_CONFIG);
};

const handleEmailChange = async (token: string) => {
  const payload = await decryptToken<EmailChangePayload>(token);

  if (!payload) {
    setEmailChangeCookie("error", "invalidToken");
    return false;
  }

  await prisma.user.update({
    where: { email: payload.fromEmail },
    data: { email: payload.toEmail },
  });

  setEmailChangeCookie("success");

  return true;
};

export const GET = async (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 });
  }

  const session = await getServerSession();

  if (!session || !session.user.email) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${request.url}`, request.url),
    );
  }

  await handleEmailChange(token);

  return NextResponse.redirect(new URL("/settings/profile", request.url));
};
