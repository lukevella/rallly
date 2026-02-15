import type { Page } from "@playwright/test";
import { prisma } from "@rallly/database";
import crypto from "node:crypto";

export async function loginAsUser(page: Page, userId: string) {
  const token = crypto.randomBytes(32).toString("hex");

  await prisma.session.create({
    data: {
      id: crypto.randomUUID(),
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
      userId,
    },
  });

  await page.context().addCookies([
    {
      name: "better-auth.session_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

export function screenshotPath(name: string) {
  return `screenshots/${name}.png`;
}
