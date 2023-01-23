import { expect, test } from "@playwright/test";

test("should be able to vote and comment on a poll", async ({ page }) => {
  const touchRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      request.url().includes("/api/trpc/polls.touch"),
  );

  await page.goto("/demo");

  await expect(page.locator('text="Lunch Meeting"')).toBeVisible();

  await page.type('[placeholder="Your name…"]', "Test user");
  // There is a hidden checkbox (nth=0) that exists so that the behaviour of the form is consistent even
  // when we only have a single option/checkbox.
  await page.locator("data-testid=vote-selector >> nth=0").click();
  await page.locator("data-testid=vote-selector >> nth=2").click();
  await page.click("text='Save'");
  await expect(page.locator("text='Test user'")).toBeVisible();
  await expect(
    page.locator("data-testid=participant-row >> nth=4").locator("text=You"),
  ).toBeVisible();
  await page.type(
    "[placeholder='Leave a comment on this poll (visible to everyone)']",
    "This is a comment!",
  );
  await page.type('[placeholder="Your name…"]', "Test user");
  await page.click("text='Comment'");

  const comment = page.locator("data-testid=comment");
  await expect(comment.locator("text='This is a comment!'")).toBeVisible();
  await expect(comment.locator("text=You")).toBeVisible();

  // make sure call to touch RPC is made
  await touchRequest;
});
