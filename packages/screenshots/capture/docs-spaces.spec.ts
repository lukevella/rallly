import type { Locator } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { deleteAllMessages, loginWithEmail } from "@rallly/test-helpers";
import { docsImagePath } from "./helpers";

test.use({ deviceScaleFactor: 2, viewport: { width: 1280, height: 900 } });

const pollId = "docs-delete-poll";

// A dialog animates in, so its box is only final once two reads agree.
async function settledBox(locator: Locator) {
  await locator.waitFor();
  let previous = "";
  await expect
    .poll(
      async () => {
        const current = JSON.stringify(await locator.boundingBox());
        const settled = current === previous;
        previous = current;
        return settled;
      },
      { intervals: [100] },
    )
    .toBe(true);
  const box = await locator.boundingBox();
  if (!box) throw new Error("dialog not visible");
  return box;
}

// The Pro space, so billing shows a subscription. Selecting it is undone
// after the run so other captures start from the space they expect.
const proMembershipId = "sm-2";
let savedLastSelectedAt: Date;
// The seeded owner's avatar is a real photo; the members list shows
// initials instead.
let savedImage: string | null;

test.beforeAll(async () => {
  ({ image: savedImage } = await prisma.user.findUniqueOrThrow({
    where: { id: "user-1" },
    select: { image: true },
  }));
  await prisma.user.update({ where: { id: "user-1" }, data: { image: null } });
  ({ lastSelectedAt: savedLastSelectedAt } =
    await prisma.spaceMember.findUniqueOrThrow({
      where: { id: proMembershipId },
      select: { lastSelectedAt: true },
    }));
  await prisma.spaceMember.update({
    where: { id: proMembershipId },
    data: { lastSelectedAt: new Date() },
  });
  await prisma.poll.delete({ where: { id: pollId } }).catch(() => {});
  await prisma.poll.create({
    data: {
      id: pollId,
      title: "Team offsite",
      userId: "user-1",
      spaceId: "space-2",
      status: "open",
      timeZone: "America/New_York",
      options: {
        create: [{ startTime: new Date(Date.now() + 7 * 864e5), duration: 60 }],
      },
    },
  });
});

test.afterAll(async () => {
  await prisma.user.update({
    where: { id: "user-1" },
    data: { image: savedImage },
  });
  await prisma.spaceMember.update({
    where: { id: proMembershipId },
    data: { lastSelectedAt: savedLastSelectedAt },
  });
  await prisma.poll.delete({ where: { id: pollId } }).catch(() => {});
});

test("spaces and poll admin screenshots", async ({ page }) => {
  await deleteAllMessages();
  await loginWithEmail(page, { email: "dev@rallly.co" });

  await page.goto("/settings/members");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: docsImagePath("spaces/members"),
    clip: { x: 0, y: 0, width: 1280, height: 360 },
  });

  await page.goto("/settings/billing");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: docsImagePath("spaces/billing"),
    clip: { x: 0, y: 0, width: 1280, height: 600 },
  });

  await page.getByRole("button", { name: "Manage seats" }).click();
  const seatsDialog = page.getByRole("dialog");
  const seatsBox = await settledBox(seatsDialog);
  await page.screenshot({
    path: docsImagePath("spaces/manage-seats"),
    clip: {
      x: seatsBox.x - 40,
      y: seatsBox.y - 40,
      width: seatsBox.width + 80,
      height: seatsBox.height + 80,
    },
  });

  await page.goto("/settings/general");
  const collaboration = page
    .getByText("How members work together in this space")
    .locator("xpath=ancestor::*[contains(@class, 'rounded')][1]");
  await collaboration.waitFor();
  await page.waitForLoadState("networkidle");
  // The app scrolls an inner container, so the section is brought into the
  // viewport before its box is read.
  await collaboration.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const collaborationBox = await collaboration.boundingBox();
  if (!collaborationBox) throw new Error("collaboration section not visible");
  await page.screenshot({
    path: docsImagePath("spaces/collaboration-settings"),
    clip: collaborationBox,
  });

  await page.goto(`/poll/${pollId}`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Manage" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).waitFor();
  await page.screenshot({
    path: docsImagePath("administrators/delete-poll-menu"),
    clip: { x: 0, y: 0, width: 1280, height: 560 },
  });
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const confirm = page.getByRole("alertdialog").or(page.getByRole("dialog"));
  const box = await settledBox(confirm);
  await page.screenshot({
    path: docsImagePath("administrators/delete-poll-confirm"),
    clip: {
      x: box.x - 40,
      y: box.y - 40,
      width: box.width + 80,
      height: box.height + 80,
    },
  });
});
