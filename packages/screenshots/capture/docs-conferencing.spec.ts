import type { Page } from "@playwright/test";
import { test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { deleteAllMessages, loginWithEmail } from "@rallly/test-helpers";
import { encrypt } from "@rallly/utils/encryption";
import { docsImagePath } from "./helpers";

test.use({ deviceScaleFactor: 2 });

const userId = "user-1";
const pollId = "docs-conferencing-poll";

// Listed in the order the app offers them, so each guide's screenshots show
// the same settings page and menu.
const providers = [
  {
    provider: "meet",
    label: "Google Meet",
    dir: "google-meet",
    credentialProvider: "google",
    integrationId: "google-meet",
    scopes: ["https://www.googleapis.com/auth/meetings.space.created"],
    email: "jessie.smith@example.com",
    extras: { notConnected: true, disconnect: true, pollPage: false },
  },
  {
    provider: "zoom",
    label: "Zoom",
    dir: "zoom",
    credentialProvider: "zoom",
    integrationId: "zoom",
    scopes: ["user:read:user", "meeting:write:meeting"],
    email: "jessie.smith@example.com",
    extras: { notConnected: true, disconnect: true, pollPage: true },
  },
  {
    provider: "teams",
    label: "Microsoft Teams",
    dir: "microsoft-teams",
    credentialProvider: "microsoft",
    integrationId: "microsoft-teams",
    scopes: ["OnlineMeetings.ReadWrite"],
    email: "jessie.smith@contoso.example",
    extras: { notConnected: false, disconnect: false, pollPage: false },
  },
  {
    provider: "webex",
    label: "Webex",
    dir: "webex",
    credentialProvider: "webex",
    integrationId: "webex",
    scopes: ["meeting:schedules_write", "spark:people_read"],
    email: "jessie.smith@example.com",
    extras: { notConnected: false, disconnect: false, pollPage: false },
  },
] as const;

async function clearConnections() {
  await prisma.conferencingConnection.deleteMany({
    where: { userId, provider: { in: providers.map((p) => p.provider) } },
  });
  await prisma.credential.deleteMany({
    where: { userId, providerAccountId: { startsWith: "docs-" } },
  });
  await prisma.poll.deleteMany({ where: { id: pollId } });
}

async function seedConnection({
  provider,
  credentialProvider,
  integrationId,
  scopes,
  email,
  label,
}: {
  provider: string;
  credentialProvider: string;
  integrationId: string;
  scopes: readonly string[];
  email: string;
  label: string;
}) {
  const secretPassword = process.env.SECRET_PASSWORD;
  if (!secretPassword) {
    throw new Error("SECRET_PASSWORD is required to seed a credential");
  }
  const providerAccountId = `docs-${provider}`;
  const credential = await prisma.credential.create({
    data: {
      userId,
      provider: credentialProvider,
      providerAccountId,
      type: "OAUTH",
      secret: encrypt(
        JSON.stringify({ accessToken: "docs-token", scopes }),
        secretPassword,
      ),
      scopes: [...scopes],
    },
  });
  await prisma.conferencingConnection.create({
    data: {
      userId,
      provider,
      integrationId,
      providerAccountId,
      email,
      displayName: label,
      credentialId: credential.id,
    },
  });
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

// The Pro space, so Zoom, Teams and Webex are offered without the pay wall.
// Selecting it and switching off its custom branding are both undone after
// the run, so the guides show the default theme and other captures start
// from the space they expect.
const proSpaceId = "space-2";
const proMembershipId = "sm-2";
let savedBranding: { primaryColor: string | null; showBranding: boolean };
let savedLastSelectedAt: Date;
// The poll form's calendar starts on Monday whatever the shared dev user
// was last set to.
let savedWeekStart: number | null;

test.beforeAll(async () => {
  await clearConnections();
  ({ weekStart: savedWeekStart } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { weekStart: true },
  }));
  await prisma.user.update({ where: { id: userId }, data: { weekStart: 1 } });
  ({ lastSelectedAt: savedLastSelectedAt } =
    await prisma.spaceMember.findUniqueOrThrow({
      where: { id: proMembershipId },
      select: { lastSelectedAt: true },
    }));
  await prisma.spaceMember.update({
    where: { id: proMembershipId },
    data: { lastSelectedAt: new Date() },
  });
  savedBranding = await prisma.space.findUniqueOrThrow({
    where: { id: proSpaceId },
    select: { primaryColor: true, showBranding: true },
  });
  await prisma.space.update({
    where: { id: proSpaceId },
    data: { primaryColor: null, showBranding: false },
  });
});
test.afterAll(async () => {
  await clearConnections();
  await prisma.user.update({
    where: { id: userId },
    data: { weekStart: savedWeekStart },
  });
  await prisma.space.update({
    where: { id: proSpaceId },
    data: savedBranding,
  });
  await prisma.spaceMember.update({
    where: { id: proMembershipId },
    data: { lastSelectedAt: savedLastSelectedAt },
  });
});

async function openPollForm(page: Page) {
  await page.goto("/new");
  await settle(page);
  await page.getByLabel("Title").fill("Design review");
  const form = page.locator("#create-poll");
  const formBox = await form.boundingBox();
  if (!formBox) throw new Error("poll form not visible");
  return { form, formBox };
}

async function chooseProvider(page: Page, label: string) {
  await page.getByRole("button", { name: "Add video call" }).click();
  await page.getByRole("menuitem", { name: label }).click();
}

const pad = 24;

function formClip(
  formBox: { x: number; y: number; width: number },
  bottom: number,
) {
  return {
    x: formBox.x - pad,
    y: formBox.y - pad,
    width: formBox.width + pad * 2,
    height: bottom - formBox.y + pad * 2,
  };
}

async function formBottom(page: Page) {
  const addDescription = await page
    .getByRole("button", { name: "Add description" })
    .boundingBox();
  if (!addDescription) throw new Error("form buttons not visible");
  return addDescription.y + addDescription.height;
}

for (const config of providers) {
  const { provider, label, dir, extras } = config;
  test(`${dir} screenshots`, async ({ page }) => {
    await clearConnections();
    await page.setViewportSize({ width: 1280, height: 900 });
    await deleteAllMessages();
    await loginWithEmail(page, { email: "dev@rallly.co" });

    await page.goto("/settings/conferencing");
    await settle(page);
    await page.screenshot({
      path: docsImagePath(`integrations/${dir}/connect-account`),
      clip: { x: 0, y: 0, width: 1280, height: 640 },
    });

    if (extras.notConnected) {
      const { form, formBox } = await openPollForm(page);
      await chooseProvider(page, label);
      await form.getByText(`${label} is not connected`).waitFor();
      await page.mouse.move(0, 0);
      await page.screenshot({
        path: docsImagePath(`integrations/${dir}/not-connected`),
        clip: formClip(formBox, await formBottom(page)),
      });
    }

    await seedConnection(config);
    await page.goto("/settings/conferencing");
    await settle(page);
    await page.screenshot({
      path: docsImagePath(`integrations/${dir}/connected-account`),
      clip: { x: 0, y: 0, width: 1280, height: 640 },
    });

    if (extras.disconnect) {
      await page.getByRole("button", { name: "More options" }).click();
      await page.getByRole("menuitem", { name: "Disconnect" }).waitFor();
      await page.screenshot({
        path: docsImagePath(`integrations/${dir}/disconnect-menu`),
        clip: { x: 0, y: 0, width: 1280, height: 640 },
      });
      await page.keyboard.press("Escape");
    }

    const { form, formBox } = await openPollForm(page);
    await page.getByRole("button", { name: "Add video call" }).click();
    await page.getByRole("menuitem", { name: label }).waitFor();
    const menuBox = await page.getByRole("menu").boundingBox();
    if (!menuBox) throw new Error("menu not visible");
    await page.screenshot({
      path: docsImagePath(`integrations/${dir}/video-call-menu`),
      clip: formClip(formBox, menuBox.y + menuBox.height),
    });

    await page.getByRole("menuitem", { name: label }).click();
    await form.getByText(label, { exact: true }).waitFor();
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: docsImagePath(`integrations/${dir}/selected`),
      clip: formClip(formBox, await formBottom(page)),
    });

    if (extras.pollPage) {
      await prisma.poll.create({
        data: {
          id: pollId,
          title: "Design review",
          userId,
          spaceId: proSpaceId,
          status: "open",
          timeZone: "America/New_York",
          conferencing: { provider },
          options: {
            create: [
              { startTime: new Date(Date.now() + 7 * 864e5), duration: 60 },
            ],
          },
        },
      });
      await page.goto(`/poll/${pollId}`);
      await settle(page);
      await page.screenshot({
        path: docsImagePath(`integrations/${dir}/poll-page`),
        clip: { x: 0, y: 0, width: 1280, height: 320 },
      });
    }
  });
}
