import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import type { EditOptionsPage } from "tests/edit-options-page";
import { NewPollPage } from "tests/new-poll-page";

test.describe("edit options", () => {
  let page: Page;
  let editOptionsPage: EditOptionsPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const dialog = await newPollPage.create({ name: "Monthly Meetup" });
    const pollPage = await dialog.goToPollPage();
    await pollPage.addParticipant("Mark");
    editOptionsPage = await pollPage.editOptions();
  });

  test("should show warning when deleting options with votes in them", async () => {
    // Polls default to timed options. Selecting all-day replaces the voted
    // time options with date options, which deletes the options that have votes.
    await editOptionsPage.selectAllDay();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.locator('text="Are you sure?"')).toBeVisible();
    await page.click("text='Delete'");
  });
});
