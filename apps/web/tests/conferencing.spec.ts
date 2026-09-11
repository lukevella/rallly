import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { encrypt } from "@rallly/utils/encryption";
import { NewPollPage } from "./new-poll-page";
import { createUserInDb, loginWithEmail } from "./test-utils";

const runId = Date.now().toString(36);

// Seeds what the OAuth callback would have written, so the UI can be
// exercised without driving Zoom's consent screen.
async function seedZoomConnection(userId: string) {
  const secretPassword = process.env.SECRET_PASSWORD;
  if (!secretPassword) {
    throw new Error("SECRET_PASSWORD is required to seed a credential");
  }
  const credential = await prisma.credential.create({
    data: {
      userId,
      provider: "zoom",
      providerAccountId: `zoom-${runId}`,
      type: "OAUTH",
      secret: encrypt(
        JSON.stringify({
          accessToken: "test-token",
          scopes: ["meeting:write:meeting"],
        }),
        secretPassword,
      ),
      scopes: ["meeting:write:meeting"],
    },
  });
  return prisma.conferencingConnection.create({
    data: {
      userId,
      provider: "zoom",
      integrationId: "zoom",
      providerAccountId: `zoom-${runId}`,
      email: `organizer-${runId}@zoom.example`,
      displayName: "Zoom",
      credentialId: credential.id,
    },
  });
}

test.describe
  .serial("conferencing integrations", () => {
    let page: Page;
    let userId: string;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      const email = `organizer-${runId}@example.com`;
      const user = await createUserInDb({ email, name: "Organizer" });
      userId = user.id;
      await loginWithEmail(page, { email });
    });

    test.afterAll(async () => {
      await prisma.user.delete({ where: { id: userId } });
    });

    test("settings page starts empty and offers the configured providers", async () => {
      await page.goto("/settings/conferencing");
      await expect(
        page.getByRole("heading", { name: "Conferencing" }),
      ).toBeVisible();
      await expect(page.getByText("No accounts connected")).toBeVisible();

      await page.getByRole("button", { name: "Connect account" }).click();
      await expect(page.getByRole("menuitem", { name: "Zoom" })).toBeVisible();
      await page.keyboard.press("Escape");
    });

    test("poll form blocks a provider the organizer has not connected", async () => {
      const newPollPage = new NewPollPage(page);
      await newPollPage.goto();

      await page.getByRole("button", { name: "Add conferencing" }).click();
      await page.getByRole("menuitem", { name: "Zoom" }).click();

      const error = page.locator("#create-poll").getByRole("alert");
      await expect(error).toContainText("Connect your Zoom account");
      await expect(
        error.getByRole("link", { name: "Settings → Conferencing" }),
      ).toHaveAttribute("href", "/settings/conferencing");

      await page.getByRole("button", { name: "Remove" }).click();
      await expect(
        page.getByRole("button", { name: "Add conferencing" }),
      ).toBeVisible();
    });

    test("settings page lists a connected account", async () => {
      await seedZoomConnection(userId);
      await page.goto("/settings/conferencing");
      await expect(
        page.getByText(`organizer-${runId}@zoom.example`),
      ).toBeVisible();
    });

    test("poll form accepts a connected provider and stores it", async () => {
      const newPollPage = new NewPollPage(page);
      await newPollPage.goto();

      await page.getByRole("button", { name: "Add conferencing" }).click();
      await page.getByRole("menuitem", { name: "Zoom" }).click();
      await expect(page.locator("#create-poll").getByRole("alert")).toHaveCount(
        0,
      );

      const pollPage = await newPollPage.create({ name: `Zoom poll ${runId}` });
      await pollPage.closeShareDialog();

      const poll = await prisma.poll.findFirstOrThrow({
        where: { title: `Zoom poll ${runId}` },
        select: { conferencingProvider: true },
      });
      expect(poll.conferencingProvider).toBe("zoom");
    });

    test("disconnecting removes the account", async () => {
      await page.goto("/settings/conferencing");
      await page.getByRole("button", { name: "More options" }).click();
      await page.getByRole("menuitem", { name: "Disconnect" }).click();
      await expect(page.getByText("No accounts connected")).toBeVisible();
      expect(
        await prisma.conferencingConnection.count({ where: { userId } }),
      ).toBe(0);
    });
  });
