import { expect, test } from "@playwright/test";

test("should be able to create a new poll and delete it", async ({ page }) => {
  await page.goto("/new");
  await page.type('[placeholder="Monthly Meetup"]', "Monthly Meetup");
  // click on label to focus on input
  await page.click('text="Location"');
  await page.keyboard.type("Joe's Coffee Shop");

  await page.click('text="Description"');

  await page.keyboard.type("This is a test description");

  await page.click('text="Continue"');

  await page.click('[title="Next month"]');

  // Select a few days
  await page.click("text=/^5$/");
  await page.click("text=/^7$/");
  await page.click("text=/^10$/");
  await page.click("text=/^15$/");

  await page.click('text="Continue"');

  await page.type('[placeholder="Jessie Smith"]', "John");
  await page.type(
    '[placeholder="jessie.smith@email.com"]',
    "john.doe@email.com",
  );

  await page.click('text="Create poll"');

  await expect(page.locator("data-testid=poll-title")).toHaveText(
    "Monthly Meetup",
  );

  // let's delete the poll we just created
  await page.click("text=Manage");
  await page.click("text=Delete poll");

  const deletePollForm = page.locator("data-testid=delete-poll-form");

  // button should be disabled
  await expect(deletePollForm.locator("text=Delete poll")).toBeDisabled();

  // enter confirmation text
  await page.type("[placeholder=delete-me]", "delete-me");

  // button should now be enabled
  await deletePollForm.locator("text=Delete poll").click();

  // expect delete message to appear
  await expect(page.locator("text=Deleted poll")).toBeVisible();
});
