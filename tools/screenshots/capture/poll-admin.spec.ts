import { test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { loginAsUser, screenshotPath } from "./helpers";

test("poll admin", async ({ page }) => {
  await loginAsUser(page, "pro-user");

  const poll = await prisma.poll.findFirst({
    where: { userId: "pro-user" },
    orderBy: { createdAt: "desc" },
  });

  if (!poll) {
    throw new Error("No poll found for pro-user. Run pnpm db:reset first.");
  }

  await page.goto(`/poll/${poll.id}`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: screenshotPath("poll-admin"),
    fullPage: true,
  });
});
