import { expect, test } from "@playwright/test";

test("should show warning when deleting options with votes in them", async ({
  page,
}) => {
  await page.goto("/demo");

  await expect(page.locator('text="Lunch Meeting Demo"')).toBeVisible();

  await page.click("text='Manage'");
  await page.click("text='Edit options'");
  await page.click("[data-testid='specify-times-switch']");
  await page.click("text='12:00 PM'");
  await page.click("text='1:00 PM'");
  await page.locator("div[role='dialog']").locator("text='Save'").click();
  await expect(page.locator('text="Are you sure?"')).toBeVisible();
  await page.click("text='Delete'");
});
