import type { Page } from "@playwright/test";
import { prisma } from "@rallly/database";
import { LoginPage } from "./login-page";

export async function createUserInDb(
  email: string,
  name: string,
  role: "user" | "admin" = "user",
) {
  return prisma.user.create({
    data: {
      email,
      name,
      role,
      emailVerified: new Date(),
    },
  });
}

export async function loginWithEmail(page: Page, email: string) {
  const loginPage = new LoginPage(page);
  await loginPage.login({
    email,
  });
}
