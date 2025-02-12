import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";

import { encode } from "./helpers/next-auth-v4";

const legacyGuestId = "user-1234";

test.describe.serial(() => {
  test.beforeAll(async () => {
    await prisma.poll.create({
      data: {
        id: "legacy-guest-poll",
        title: "Test Poll",
        adminUrlId: "admin-url-id",
        participantUrlId: "participant-url-id",
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
    const legacyToken = await encode({
      token: {
        sub: legacyGuestId,
      },
      secret: process.env.SECRET_PASSWORD,
    });

    // set cookie to simulate legacy guest
    await context.addCookies([
      {
        name: "next-auth.session-token",
        value: legacyToken,
        httpOnly: true,
        expires: Date.now() / 1000 + 60 * 60 * 24 * 7,
        secure: false,
        sameSite: "Lax",
        domain: "localhost",
        path: "/",
      },
    ]);

    // For some reason it doesn't work unless we need to redirect
    await page.goto("/login");

    // Check if the poll title exists in the page content
    await expect(page.getByText("Test Poll")).toBeVisible();
  });
});
