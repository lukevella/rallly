import type { Page } from "@playwright/test";
import type { UserRole } from "@rallly/database";
import { prisma } from "@rallly/database";
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
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        role,
        locale: "en",
        timeZone: "Europe/London",
        emailVerified: new Date(),
      },
    });

    const space = await tx.space.create({
      data: {
        name: "Personal",
        ownerId: user.id,
      },
    });

    await tx.spaceMember.create({
      data: {
        spaceId: space.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    return user;
  });
}

export async function loginWithEmail(page: Page, { email }: { email: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login({
    email,
  });
}
