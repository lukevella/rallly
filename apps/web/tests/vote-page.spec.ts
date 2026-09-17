import type { Locator } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { NewPollPage } from "./new-poll-page";

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) {
    throw new Error("Element has no bounding box");
  }
  return rect;
}

test.describe("vote page", () => {
  let voteUrl: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.create({ name: "Vote Page Meetup" });
    const inviteUrl = await pollPage.copyInviteLink();
    voteUrl = `${inviteUrl.replace(/\?.*$/, "")}/vote`;
    await page.close();
  });

  test("desktop shows the event beside the list and saves a response", async ({
    page,
  }) => {
    await page.goto(voteUrl);

    const main = page.locator("#main-content");
    const sidebar = main.getByRole("complementary");
    await expect(sidebar.getByRole("heading", { level: 1 })).toHaveText(
      "Vote Page Meetup",
    );

    // Sidebar sits to the left of the list at desktop width
    const sidebarBox = await box(sidebar);
    const optionBox = await box(main.getByTestId("poll-option").first());
    expect(optionBox.x).toBeGreaterThan(sidebarBox.x + sidebarBox.width - 1);

    // The grid never renders on this page
    await expect(page.getByTestId("add-participant-button")).toHaveCount(0);

    await page
      .getByTestId("vote-selector")
      .first()
      .getByRole("radio", { name: "Yes" })
      .click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByPlaceholder("Jessie Smith").fill("Test user");
    await page.getByRole("button", { name: "Save availability" }).click();
    await expect(page.getByText("Your response has been saved")).toBeVisible();
    await page.getByRole("button", { name: "Back to poll" }).click();

    await expect(main.getByTestId("participant-selector")).toContainText(
      "Test user",
    );
  });

  test("mobile stacks the event above the list", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();
    await page.goto(voteUrl);

    const main = page.locator("#main-content");
    const sidebar = main.getByRole("complementary");
    await expect(sidebar.getByRole("heading", { level: 1 })).toHaveText(
      "Vote Page Meetup",
    );
    const sidebarBox = await box(sidebar);
    const optionBox = await box(main.getByTestId("poll-option").first());
    expect(optionBox.y).toBeGreaterThan(sidebarBox.y + sidebarBox.height - 1);

    await context.close();
  });
});
