import { expect, test } from "@playwright/test";

test("should be able to vote and comment on a poll", async ({ page }) => {
  await page.goto("/demo");

  await expect(page.locator('text="Lunch Meeting Demo"')).toBeVisible();

  await page.type('[placeholder="Your name"]', "Test user");
  // There is a hidden checkbox (nth=0) that exists so that the behaviour of the form is consistent even
  // when we only have a single option/checkbox.
  await page.locator('[name="votes"] >> nth=1').click();
  await page.locator('[name="votes"] >> nth=3').click();
  await page.click('[data-testid="submitNewParticipant"]');
  await expect(page.locator("text='Test user'")).toBeVisible();
  await expect(page.locator("text=Guest")).toBeVisible();
  await expect(
    page.locator("data-testid=participant-row >> nth=0").locator("text=You"),
  ).toBeVisible();
  await page.type(
    "[placeholder='Thanks for the invite!']",
    "This is a comment!",
  );
  await page.type('[placeholder="Your name…"]', "Test user");
  await page.click("text='Comment'");

  const comment = page.locator("data-testid=comment");
  await expect(comment.locator("text='This is a comment!'")).toBeVisible();
  await expect(comment.locator("text=You")).toBeVisible();
});
