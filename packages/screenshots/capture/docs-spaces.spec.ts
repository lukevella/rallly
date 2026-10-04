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

test.beforeAll(async () => {
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
