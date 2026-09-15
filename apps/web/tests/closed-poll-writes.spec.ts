import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { NewPollPage } from "./new-poll-page";

// The client hides the voting controls once a poll leaves "open"
// (`canAddNewParticipant` / `canEditParticipant`). These tests pin the
// server-side rule behind that: a page opened while the poll was open goes
// stale when the organizer closes it, and every write it can still send has
// to be refused by the action rather than merely hidden by the next render.

const closedMessage = "No more responses are being accepted.";

async function getPollId(page: Page) {
  const pollId = page.url().match(/\/poll\/([^/?]+)/)?.[1];
  expect(pollId).toBeTruthy();
  return pollId as string;
}

test.describe("writes to a closed poll", () => {
  test("the actions refuse every write once the poll is closed", async ({
    page,
  }) => {
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.create({ name: "Closed Poll Meetup" });
    await pollPage.closeShareDialog();
    const pollId = await getPollId(page);

    // A response added while the poll is still open, so the edit paths below
    // have a real target that only the poll's status disqualifies.
    await pollPage.addParticipant("Anne");
    const row = page.getByTestId("participant-row").filter({ hasText: "Anne" });
    await expect(row).toBeVisible();

    // Closed behind the page's back: its controls stay on screen.
    await prisma.poll.update({
      where: { id: pollId },
      data: { status: "closed", closedReason: "manual" },
    });

    await row.getByTestId("participant-menu").click();
    await page.getByRole("menuitem", { name: "Change name" }).click();
    const renameDialog = page.getByRole("dialog", { name: "Change name" });
    await renameDialog.getByLabel("Name").fill("Renamed");
    await renameDialog.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(closedMessage).first()).toBeVisible();
    await expect(renameDialog).toBeVisible();
    await renameDialog.getByRole("button", { name: "Cancel" }).click();

    await row.getByTestId("participant-menu").click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const deleteDialog = page.getByRole("dialog", { name: "Delete Anne?" });
    await deleteDialog.getByRole("button", { name: "Delete" }).click();
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Cancel" }).click();

    await row.getByTestId("participant-menu").click();
    await page.getByRole("menuitem", { name: "Edit votes" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText(closedMessage).first()).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();

    await page.getByTestId("add-participant-button").click();
    await page.locator("data-testid=vote-selector >> nth=0").click();
    await page.click("button >> text='Continue'");
    await page.type('[placeholder="Jessie Smith"]', "Late");
    await page.click("text='Save availability'");
    await expect(
      page.getByText("This poll is no longer accepting responses."),
    ).toBeVisible();

    // Nothing above reached the database.
    const participants = await prisma.participant.findMany({
      where: { pollId },
      select: { name: true, votes: { select: { type: true } } },
    });
    expect(participants).toHaveLength(1);
    expect(participants[0].name).toBe("Anne");
  });

  test("the actions still accept a response while the poll is open", async ({
    page,
  }) => {
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.create({ name: "Open Poll Meetup" });
    await pollPage.closeShareDialog();
    const pollId = await getPollId(page);

    await pollPage.addParticipant("Anne");
    await expect(
      page.getByTestId("participant-row").filter({ hasText: "Anne" }),
    ).toBeVisible();

    expect(await prisma.participant.count({ where: { pollId } })).toBe(1);
  });
});
