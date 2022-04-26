import { expect, test } from "@playwright/test";

test("should be able to create a new poll", async ({ page, context }) => {
  await context.addCookies([
    {
      name: "rallly_cookie_consent",
      value: "1",
      url: "http://localhost",
    },
  ]);
  await page.goto("/new");
  // // // Find an element with the text 'About Page' and click on it
  await page.type('[placeholder="Monthly Meetup"]', "Monthly Meetup");
  // click on label to focus on input
  await page.click('text="Location"');
  await page.keyboard.type("Joe's Coffee Shop");

  await page.click('text="Description"');

  await page.keyboard.type("This is a test description");

  await page.click('text="Continue"');

  await page.click('[title="Next month"]');

  await page.click("text=/^5$/");
  await page.click("text=/^7$/");
  await page.click("text=/^10$/");
  await page.click("text=/^15$/");

  await page.click('text="Continue"');

  await page.type('[placeholder="John Doe"]', "John");
  await page.type('[placeholder="john.doe@email.com"]', "john.doe@email.com");

  await page.click('text="Create poll"');

  await expect(page.locator("data-testid=poll-title")).toHaveText(
    "Monthly Meetup",
  );
});
