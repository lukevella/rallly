import { expect, Page, Request, test } from "@playwright/test";

test.describe.parallel(() => {
  let page: Page;
  let touchRequest: Promise<Request>;
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    touchRequest = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        request.url().includes("/api/trpc/polls.touch"),
    );
    await page.goto("/demo");
    await page.waitForSelector('text="Lunch Meeting"');
  });

  test("should call touch endpoint", async () => {
    // make sure call to touch RPC is made
    expect(await touchRequest).not.toBeNull();
  });

  test("should be able to comment", async () => {
    await page.getByPlaceholder("Your name…").fill("Test user");
    await page
      .getByPlaceholder("Leave a comment on this poll")
      .fill("This is a comment!");
    await page.click("text='Comment'");

    const comment = page.locator("data-testid=comment");
    await expect(comment.locator("text='This is a comment!'")).toBeVisible();
    await expect(comment.locator("text=You")).toBeVisible();
  });

  test("should be able to vote", async () => {
    // There is a hidden checkbox (nth=0) that exists so that the behaviour of the form is consistent even
    // when we only have a single option/checkbox.
    await page.locator("data-testid=vote-selector >> nth=0").click();
    await page.locator("data-testid=vote-selector >> nth=2").click();
    await page.click("button >> text='Continue'");

    await page.type('[placeholder="Jessie Smith"]', "Test user");
    await page.click("text='Submit'");

    await expect(page.locator("text='Test user'")).toBeVisible();
    await expect(
      page.locator("data-testid=participant-row >> nth=0").locator("text=You"),
    ).toBeVisible();
  });
});
