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
    const pollPage = await newPollPage.createPollAndCloseDialog();
    await pollPage.addParticipant("Mark");
    editOptionsPage = await pollPage.editOptions();
  });

  test("should show warning when deleting options with votes in them", async () => {
    editOptionsPage.switchToSpecifyTimes();

    await page.click("text='12:00 PM'");
    const listbox = page.getByRole("listbox");
    listbox.getByText("1:00 PM", { exact: true }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.locator('text="Are you sure?"')).toBeVisible();
    await page.click("text='Delete'");
  });
});
