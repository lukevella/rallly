import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { NewPollPage } from "./new-poll-page";

test.describe(() => {
  let inviteUrl: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const dialog = await newPollPage.create({ name: "Mobile Meetup" });
    const pollPage = await dialog.goToPollPage();
    inviteUrl = await pollPage.copyInviteLink();
    await page.close();
  });

  const voteAsNewParticipant = async (page: Page, name: string) => {
    await page.getByTestId("poll-option").first().click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByPlaceholder("Jessie Smith").fill(name);
    await page.getByRole("button", { name: "Save availability" }).click();
    await page.getByRole("button", { name: "Back to poll" }).click();
  };

  test("deleting a participant resets the participant selector", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();
    await page.goto(inviteUrl);

    await voteAsNewParticipant(page, "Test user");

    const selector = page.getByTestId("participant-selector");
    await expect(selector).toContainText("Test user");

    await page.getByTestId("participant-menu").click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete" })
      .click();

    await expect(selector).toContainText("All participants");

    await context.close();
  });
});
