import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import {
  createUserInDb,
  loginWithEmail,
  upgradeSpaceToPro,
} from "./test-utils";

// A poll admin page authorizes against the poll's own space, so a member of
// several spaces can open a poll that belongs to a space other than the
// active one. The page's paid features follow the poll's space, both in the
// controls it shows and in what the server allows, and opening it does not
// change which space is active.

// One login shared by both tests: the second checks the state the first
// leaves behind.
test.describe.configure({ mode: "serial" });

const runId = Date.now().toString(36);
const createdUserIds: string[] = [];

let page: Page;
let pollId: string;
let teamName: string;

function emailFor(name: string) {
  return `${name.toLowerCase().replace(/\s/g, "-")}-${runId}@example.com`;
}

test.beforeAll(async ({ browser }) => {
  const owner = await createUserInDb({
    email: emailFor("Team Owner"),
    name: "Team Owner",
  });
  createdUserIds.push(owner.id);
  const team = await prisma.space.findFirstOrThrow({
    where: { ownerId: owner.id },
  });
  teamName = `Marketing ${runId}`;
  await prisma.space.update({
    where: { id: team.id },
    data: { name: teamName },
  });
  await upgradeSpaceToPro({ spaceId: team.id, userId: owner.id, seats: 2 });

  const email = emailFor("Jessie Smith");
  const member = await createUserInDb({ email, name: "Jessie Smith" });
  createdUserIds.push(member.id);

  // The member's own hobby space is the active one: selected now, the team
  // space long ago.
  await prisma.spaceMember.updateMany({
    where: { userId: member.id },
    data: { lastSelectedAt: new Date() },
  });
  await prisma.spaceMember.create({
    data: {
      spaceId: team.id,
      userId: member.id,
      role: "MEMBER",
      lastSelectedAt: new Date(0),
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setMinutes(0, 0, 0);

  const poll = await prisma.poll.create({
    data: {
      id: `space-tier-${runId}`,
      title: "Team offsite",
      userId: member.id,
      spaceId: team.id,
      kind: "time",
      options: {
        create: {
          startTime: tomorrow,
          duration: 60,
        },
      },
    },
  });
  pollId = poll.id;

  page = await browser.newPage();
  await loginWithEmail(page, { email });
});

test.afterAll(async () => {
  await page.close();
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
});

test("a poll in a pro space keeps its pro features while a hobby space is active", async () => {
  await page.goto(`/poll/${pollId}`);
  await expect(page).toHaveURL(new RegExp(`/poll/${pollId}$`));

  await page.getByRole("button", { name: "Manage" }).click();
  const duplicateItem = page.getByRole("menuitem", { name: "Duplicate" });
  await expect(duplicateItem).not.toContainText("Pro");
  await duplicateItem.click();

  await page.getByLabel("Title").fill("Team offsite copy");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Duplicate" })
    .click();

  await expect(page).toHaveURL(/\/poll\/(?!space-tier-)[\w-]+$/);
  await expect(
    page.getByRole("heading", { name: "Team offsite copy" }).first(),
  ).toBeVisible();
});

test("opening the poll leaves the active space unchanged", async () => {
  await page.goto("/polls");
  await expect(page.getByRole("button", { name: /Personal/ })).toBeVisible();
  await expect(page.getByRole("button", { name: teamName })).not.toBeVisible();
});
