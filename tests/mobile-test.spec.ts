import { expect, test } from "@playwright/test";

test("should be able to vote and comment on a poll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/demo");

  await expect(page.locator('text="Lunch Meeting"')).toBeVisible();

  await page.click("text='New'");
  await page.click("data-testid=poll-option >> nth=0");
  await page.click("data-testid=poll-option >> nth=1");
  await page.click("data-testid=poll-option >> nth=3");
  await page.type('[placeholder="Your name…"]', "Test user");

  await page.click("text=Save");
  await expect(page.locator("data-testid=user")).toBeVisible();
  await expect(
    page.locator("data-testid=participant-selector").locator("text=You"),
  ).toBeVisible();

  await page.click("text=Edit");
  await page.click("data-testid=poll-option >> nth=1");
  await page.click("text=Save");

  await page.click("data-testid=delete-participant-button");
  await page.locator("button", { hasText: "Delete" }).click();
  await expect(page.locator("text='Test user'")).not.toBeVisible();
});
