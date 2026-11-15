import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { deleteAllMessages } from "@rallly/test-helpers";
import { NewPollPage } from "./new-poll-page";

test.describe.serial(() => {
  let page: Page;
  let pollId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await deleteAllMessages(); // Clean the mailbox before tests
  });

  test("create a new poll", async () => {
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    // Leaves the require email switch at its default, so the stored value
    // checks what an untouched form submits.
    const pollPage = await newPollPage.create({
      name: "Monthly Meetup",
      requireEmail: true,
    });
    await pollPage.closeShareDialog();

    await expect(
      page.getByRole("heading", { name: "Monthly Meetup" }),
    ).toBeVisible();
    pollId = page.url().match(/\/poll\/([a-zA-Z0-9]+)/)?.[1] ?? "";
    expect(pollId).not.toBe("");
    expect(
      await prisma.poll.findUnique({
        where: { id: pollId },
        select: { requireParticipantEmail: true },
      }),
    ).toEqual({ requireParticipantEmail: true });
  });

  // delete the poll we just created
  test("delete existing poll", async () => {
    const manageButton = page.getByRole("button", { name: "Manage" });
    await manageButton.waitFor();
    await manageButton.click();
    await page.click("text=Delete");

    const deletePollDialog = page.getByRole("dialog");

    await deletePollDialog.getByRole("button", { name: "delete" }).click();

    // Delete → invalidate → navigate to /polls → bounce to /login is a
    // long chain for the dev server; give it more than the 5s default.
    await expect(page).toHaveURL("/login?redirectTo=%2Fpolls", {
      timeout: 15_000,
    });

    // The soft delete records the transition the poll's webhooks are built
    // from.
    expect(
      await prisma.pollActivity.count({
        where: { pollId, type: "poll_deleted" },
      }),
    ).toBe(1);
  });
});
