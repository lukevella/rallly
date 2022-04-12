import { expect, test } from "@playwright/test";

test("should be able to vote and comment on a poll", async ({ page }) => {
  await page.goto("/demo");

  await expect(page.locator('text="Lunch Meeting Demo"')).toBeVisible();

  await page.click("text='New Participant'");
  await page.type('[placeholder="Your name"]', "Test user");
  // There is a hidden checkbox (nth=0) that exists so that the behaviour of the form is consistent even
  // when we only have a single option/checkbox.
  await page.locator('[name="votes"] >> nth=1').click();
  await page.locator('[name="votes"] >> nth=3').click();
  await page.click('[data-testid="submitNewParticipant"]');
  await expect(page.locator("text='Test user'")).toBeVisible();

  await page.type("[placeholder='Add your comment…']", "This is a comment!");
  await page.click("text='Send'");

  await expect(page.locator("text='This is a comment!'")).toBeVisible();
});
