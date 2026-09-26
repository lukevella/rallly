import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { encrypt } from "@rallly/utils/encryption";
import { NewPollPage } from "./new-poll-page";
import { createUserInDb, loginWithEmail } from "./test-utils";

const runId = Date.now().toString(36);

async function seedCredential({
  userId,
  provider,
  providerAccountId,
  scopes,
}: {
  userId: string;
  provider: string;
  providerAccountId: string;
  scopes: string[];
}) {
  const secretPassword = process.env.SECRET_PASSWORD;
  if (!secretPassword) {
    throw new Error("SECRET_PASSWORD is required to seed a credential");
  }
  return prisma.credential.create({
    data: {
      userId,
      provider,
      providerAccountId,
      type: "OAUTH",
      secret: encrypt(
        JSON.stringify({ accessToken: "test-token", scopes }),
        secretPassword,
      ),
      scopes,
    },
  });
}

// Seeds what the OAuth callback would have written, so the UI can be
// exercised without driving Zoom's consent screen.
async function seedZoomConnection(userId: string) {
  const credential = await seedCredential({
    userId,
    provider: "zoom",
    providerAccountId: `zoom-${runId}`,
    scopes: ["meeting:write:meeting"],
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

    test("settings page lists the configured providers to connect", async () => {
      await page.goto("/settings/conferencing");
      await expect(
        page.getByRole("heading", { name: "Conferencing" }),
      ).toBeVisible();
      await expect(page.getByText("Zoom", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Connect" })).toBeVisible();
    });

    test("poll form blocks a provider the organizer has not connected", async () => {
      const newPollPage = new NewPollPage(page);
      await newPollPage.goto();

      await page.getByRole("button", { name: "Add location" }).click();
      await page.getByRole("menuitem", { name: "Zoom" }).click();

      const error = page.locator("#create-poll").getByRole("alert");
      await expect(error).toContainText("Zoom is not connected");
      await expect(
        error.getByRole("link", { name: "Conferencing settings" }),
      ).toHaveAttribute("href", "/settings/conferencing");

      await page.getByRole("button", { name: "Remove" }).click();
      await page.getByRole("button", { name: "Add location" }).click();
      await expect(page.getByRole("menuitem", { name: "Zoom" })).toBeVisible();
      await page.keyboard.press("Escape");
    });

    test("settings page lists a connected account", async () => {
      await seedZoomConnection(userId);
      await page.goto("/settings/conferencing");
      await expect(
        page.getByText(`organizer-${runId}@zoom.example`),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Connect" })).toHaveCount(
        0,
      );
    });

    test("poll form accepts a connected provider and stores it", async () => {
      const newPollPage = new NewPollPage(page);
      await newPollPage.goto();

      await page.getByRole("button", { name: "Add location" }).click();
      await page.getByRole("menuitem", { name: "Zoom" }).click();
      await expect(page.locator("#create-poll").getByRole("alert")).toHaveCount(
        0,
      );

      const pollPage = await newPollPage.create({ name: `Zoom poll ${runId}` });
      await pollPage.closeShareDialog();

      const poll = await prisma.poll.findFirstOrThrow({
        where: { title: `Zoom poll ${runId}` },
        select: { conferencing: true, location: true },
      });
      expect(poll.conferencing).toEqual({ provider: "zoom" });
      expect(poll.location).toBe("Online");
    });

    test("a pasted link needs no account", async () => {
      const newPollPage = new NewPollPage(page);
      await newPollPage.goto();

      await page.getByRole("button", { name: "Add location" }).click();
      await page.getByRole("menuitem", { name: "Custom" }).click();
      await page.getByLabel("Video call").fill("Jitsi");
      await page
        .getByLabel("Link (optional)")
        .fill("https://meet.jit.si/rallly");

      const pollPage = await newPollPage.create({ name: `Link poll ${runId}` });
      await pollPage.closeShareDialog();

      const poll = await prisma.poll.findFirstOrThrow({
        where: { title: `Link poll ${runId}` },
        select: { conferencing: true },
      });
      expect(poll.conferencing).toEqual({
        provider: "custom",
        label: "Jitsi",
        uri: "https://meet.jit.si/rallly",
      });
    });

    test("a named call needs no link", async () => {
      const newPollPage = new NewPollPage(page);
      await newPollPage.goto();

      await page.getByRole("button", { name: "Add location" }).click();
      await page.getByRole("menuitem", { name: "Custom" }).click();
      await page.getByLabel("Video call").fill("Microsoft Teams");

      const pollPage = await newPollPage.create({
        name: `Named poll ${runId}`,
      });
      await pollPage.closeShareDialog();

      const poll = await prisma.poll.findFirstOrThrow({
        where: { title: `Named poll ${runId}` },
        select: { conferencing: true },
      });
      expect(poll.conferencing).toEqual({
        provider: "custom",
        label: "Microsoft Teams",
      });
    });

    test("a pasted link must be a link", async () => {
      const newPollPage = new NewPollPage(page);
      await newPollPage.goto();

      await page.getByRole("button", { name: "Add location" }).click();
      await page.getByRole("menuitem", { name: "Custom" }).click();
      await page.getByLabel("Video call").fill("Jitsi");
      await page.getByLabel("Link (optional)").fill("not a link");
      await page.getByLabel(/title|event/i).fill("Invalid link");
      await page.getByRole("button", { name: /^create poll$/i }).click();
      await expect(
        page.locator("#create-poll").getByRole("alert"),
      ).toContainText("That doesn't look like a link.");
    });

    test("disconnecting removes the account", async () => {
      await page.goto("/settings/conferencing");
      await page.getByRole("button", { name: "More options" }).click();
      await page.getByRole("menuitem", { name: "Disconnect" }).click();
      await expect(page.getByRole("button", { name: "Connect" })).toBeVisible();
      expect(
        await prisma.conferencingConnection.count({ where: { userId } }),
      ).toBe(0);
      expect(
        await prisma.credential.count({ where: { userId, provider: "zoom" } }),
      ).toBe(0);
    });

    test("disconnecting Google Meet keeps a credential the calendar still uses", async () => {
      const providerAccountId = `google-${runId}`;
      const email = `organizer-${runId}@gmail.example`;
      const credential = await seedCredential({
        userId,
        provider: "google",
        providerAccountId,
        scopes: ["https://www.googleapis.com/auth/meetings.space.created"],
      });
      await prisma.calendarConnection.create({
        data: {
          userId,
          provider: "google",
          integrationId: "google-calendar",
          providerAccountId,
          email,
          credentialId: credential.id,
        },
      });
      await prisma.conferencingConnection.create({
        data: {
          userId,
          provider: "google",
          integrationId: "google-meet",
          providerAccountId,
          email,
          displayName: "Google Meet",
          credentialId: credential.id,
        },
      });

      await page.goto("/settings/conferencing");
      await page.getByRole("button", { name: "More options" }).click();
      await page.getByRole("menuitem", { name: "Disconnect" }).click();
      await expect(page.getByText(email)).toHaveCount(0);
      expect(
        await prisma.credential.count({ where: { id: credential.id } }),
      ).toBe(1);
    });
  });
