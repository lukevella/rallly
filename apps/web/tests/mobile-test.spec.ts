import { expect, test } from "@playwright/test";

test("should be able to vote and comment on a poll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/demo");

  await expect(page.locator('text="Lunch Meeting"')).toBeVisible();

  await page.click('text="New"');
  await page.click("data-testid=poll-option >> nth=0");
  await page.click("data-testid=poll-option >> nth=1");
  await page.click("data-testid=poll-option >> nth=3");

  await page.getByText("Continue").click();

  await page.getByPlaceholder("Jessie Smith").type("Test user");
  await page.getByText(/^Submit$/).click();

  await expect(page.locator("data-testid=user")).toBeVisible();
  await expect(
    page.locator("data-testid=participant-selector").locator("text=You"),
  ).toBeVisible();

  await page.getByTestId("participant-menu").click();
  await page.getByText("Edit votes").click();
  await page.click("data-testid=poll-option >> nth=1");
  await page.click("text=Save");

  await page.getByTestId("participant-menu").click();
  await page.locator("button", { hasText: "Delete" }).click();
  const modal = page.getByTestId("modal");
  await modal.locator("button", { hasText: "Delete" }).click();
  await expect(page.locator("text='Test user'")).not.toBeVisible();
});
