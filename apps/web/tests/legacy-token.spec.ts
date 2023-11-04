import test, { expect } from "@playwright/test";
import { sealData } from "iron-session";

/**
 * This test checks that a legacy token can be used to sign in.
 */
test("should convert guest legacy token", async ({ browser }) => {
  const context = await browser.newContext();
  const guestLegacyToken = await sealData(
    {
      user: {
        id: "user-1234",
        isGuest: true,
      },
    },
    {
      password: process.env.SECRET_PASSWORD,
    },
  );
  await context.addCookies([
    {
      name: "rallly-session",
      value: guestLegacyToken,
      httpOnly: true,
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },
  ]);
  const page = await context.newPage();
  await page.goto("/polls");
  await page.getByTestId("user-dropdown").click();
  await expect(page.locator("text=user-1234")).toBeVisible();
});
