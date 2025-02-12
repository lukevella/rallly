import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { nanoid } from "@rallly/utils/nanoid";

import { encode } from "./helpers/next-auth-v4";

const legacyGuestId = "user-1234";

test.describe.serial(() => {
  test.beforeAll(async () => {
    await prisma.poll.create({
      data: {
        id: "legacy-guest-poll",
        title: "Test Poll",
        adminUrlId: nanoid(),
        participantUrlId: nanoid(),
        guestId: legacyGuestId,
      },
    });
  });
  test.afterAll(async () => {
    await prisma.poll.delete({
      where: {
        id: "legacy-guest-poll",
      },
    });
  });

  test("should see poll on login page", async ({ page }) => {
    const context = page.context();
    const token = await encode({
      token: {
        sub: legacyGuestId,
      },
      secret: process.env.SECRET_PASSWORD,
    });

    // set cookie to simulate legacy guest
    await context.addCookies([
      {
        name: "next-auth.session-token",
        value: token,
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        path: "/",
        domain: "localhost",
      },
    ]);
    await page.goto("/login");
    await expect(page.getByText("Test Poll")).toBeVisible();
  });
});
