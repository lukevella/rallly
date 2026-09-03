import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { createTestPoll, createUserInDb } from "./test-utils";

const HOST_EMAIL = "space-branding-host@rallly.co";
const POLL_ID = "space-branding-poll";
const STORED_COLOR = "#dc2626";

async function readPrimaryVar(page: Page) {
  await page.goto(`/invite/${POLL_ID}`);
  await expect(
    page.getByRole("heading", { name: "Space branding poll" }),
  ).toBeVisible();
  return page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--primary"),
  );
}

test.describe("space branding on the invite page", () => {
  let spaceId: string;
  let defaultPrimary: string;

  test.beforeAll(async ({ browser }) => {
    await prisma.user.deleteMany({ where: { email: HOST_EMAIL } });
    const host = await createUserInDb({
      email: HOST_EMAIL,
      name: "Space branding host",
    });
    const space = await prisma.space.findFirstOrThrow({
      where: { ownerId: host.id },
    });
    spaceId = space.id;
    await createTestPoll({
      id: POLL_ID,
      title: "Space branding poll",
      userId: host.id,
      spaceId,
      updatedAt: new Date(),
      hasFutureOptions: true,
    });

    const page = await browser.newPage();
    defaultPrimary = await readPrimaryVar(page);
    await page.close();
  });

  test.afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: HOST_EMAIL } });
  });

  test("pro space with branding on renders its colour", async ({ page }) => {
    await prisma.space.update({
      where: { id: spaceId },
      data: { tier: "pro", showBranding: true, primaryColor: STORED_COLOR },
    });

    expect(await readPrimaryVar(page)).not.toBe(defaultPrimary);
  });

  test("hobby space with a stored colour renders the default primary", async ({
    page,
  }) => {
    await prisma.space.update({
      where: { id: spaceId },
      data: { tier: "hobby", showBranding: true, primaryColor: STORED_COLOR },
    });

    expect(await readPrimaryVar(page)).toBe(defaultPrimary);
  });
});
