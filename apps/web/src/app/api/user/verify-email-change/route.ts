import { prisma } from "@rallly/database";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    setEmailChangeCookie("error", "invalidToken");
    return false;
  }

  const payload = await decryptToken<EmailChangePayload>(token);

  if (!payload) {
    setEmailChangeCookie("error", "invalidToken");
    return false;
  }

  await prisma.$transaction(async (tx) => {
    await Promise.all([
      tx.user.update({
        where: { email: payload.fromEmail },
        data: { email: payload.toEmail },
      }),
      tx.verificationToken.delete({
        where: { token },
      }),
    ]);
  });

  setEmailChangeCookie("success");
  return true;
};

export const GET = async (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 });
  }

  await handleEmailChange(token);

  return NextResponse.redirect(new URL("/settings/profile", request.url));
};
