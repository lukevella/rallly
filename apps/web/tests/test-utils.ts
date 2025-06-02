import type { Page } from "@playwright/test";
import { type UserRole, prisma } from "@rallly/database";
import { LoginPage } from "./login-page";

export async function createUserInDb({
  email,
  name,
  role = "user",
}: {
  email: string;
  name: string;
  role?: UserRole;
}) {
  return prisma.user.create({
    data: {
      email,
      name,
      role,
      locale: "en",
      timeZone: "Europe/London",
      emailVerified: new Date(),
    },
  });
}

export async function loginWithEmail(page: Page, { email }: { email: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login({
    email,
  });
}
