import type { Page } from "@playwright/test";
import { test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { deleteAllMessages, loginWithEmail } from "@rallly/test-helpers";
import { encrypt } from "@rallly/utils/encryption";
import { docsImagePath } from "./helpers";

test.use({ deviceScaleFactor: 2 });

const userId = "user-1";

const providers = [
  {
    provider: "teams",
    label: "Microsoft Teams",
    dir: "microsoft-teams",
    scopes: ["OnlineMeetings.ReadWrite"],
    email: "jessie.smith@contoso.example",
  },
  {
    provider: "webex",
    label: "Webex",
    dir: "webex",
    scopes: ["meeting:schedules_write", "spark:people_read"],
    email: "jessie.smith@example.com",
  },
] as const;

async function clearConnections() {
  await prisma.conferencingConnection.deleteMany({
    where: { userId, provider: { in: providers.map((p) => p.provider) } },
  });
  await prisma.credential.deleteMany({
    where: { userId, provider: { in: ["microsoft", "webex"] } },
  });
}

async function seedConnection({
  provider,
  scopes,
  email,
  label,
}: {
  provider: string;
  scopes: readonly string[];
  email: string;
  label: string;
}) {
  const secretPassword = process.env.SECRET_PASSWORD;
  if (!secretPassword) {
    throw new Error("SECRET_PASSWORD is required to seed a credential");
  }
  const credentialProvider = provider === "teams" ? "microsoft" : provider;
  const integrationId = provider === "teams" ? "microsoft-teams" : provider;
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

test.beforeAll(clearConnections);
test.afterAll(clearConnections);

for (const { provider, label, dir, scopes, email } of providers) {
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

    await seedConnection({ provider, scopes, email, label });
    await page.goto("/settings/conferencing");
    await settle(page);
    await page.screenshot({
      path: docsImagePath(`integrations/${dir}/connected-account`),
      clip: { x: 0, y: 0, width: 1280, height: 640 },
    });

    await page.goto("/new");
    await settle(page);
    const form = page.locator("#create-poll");
    const formBox = await form.boundingBox();
    if (!formBox) throw new Error("poll form not visible");
    await page.getByRole("button", { name: "Add video call" }).click();
    await page.getByRole("menuitem", { name: label }).waitFor();
    const menuBox = await page.getByRole("menu").boundingBox();
    if (!menuBox) throw new Error("menu not visible");
    await page.screenshot({
      path: docsImagePath(`integrations/${dir}/video-call-menu`),
      clip: {
        x: formBox.x,
        y: formBox.y,
        width: formBox.width,
        height: menuBox.y + menuBox.height - formBox.y + 24,
      },
    });

    await page.getByRole("menuitem", { name: label }).click();
    await form.getByText(label, { exact: true }).waitFor();
    const addDescription = await page
      .getByRole("button", { name: "Add description" })
      .boundingBox();
    if (!addDescription) throw new Error("form buttons not visible");
    await page.screenshot({
      path: docsImagePath(`integrations/${dir}/selected`),
      clip: {
        x: formBox.x,
        y: formBox.y,
        width: formBox.width,
        height: addDescription.y + addDescription.height - formBox.y + 24,
      },
    });
  });
}
