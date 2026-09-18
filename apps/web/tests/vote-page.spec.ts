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

    // The page itself never scrolls; only the list column does
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight,
    );
    expect(overflow).toBe(0);

    // The selection count follows the votes
    const bar = main.locator("footer");
    await expect(bar.getByText("0 yes, 0 if need be")).toBeVisible();
    await page
      .getByTestId("vote-selector")
      .first()
      .getByRole("radio", { name: "Yes" })
      .click();
    await expect(bar.getByText("1 yes, 0 if need be")).toBeVisible();

    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByPlaceholder("Jessie Smith").fill("Test user");
    await page.getByRole("button", { name: "Save availability" }).click();
    await expect(page.getByText("Your response has been saved")).toBeVisible();
    await page.getByRole("button", { name: "Back to poll" }).click();

    // Saved: the header names the response and offers Edit, the footer
    // goes away, and the controls give way to the recorded votes
    const header = main.locator("header");
    await expect(header.getByText("Test user")).toBeVisible();
    await expect(header.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(bar).toHaveCount(0);
    await expect(page.getByTestId("vote-selector")).toHaveCount(0);

    // The breakdown dialog lists who voted
    await main
      .getByRole("button", { name: /Show participant votes/ })
      .first()
      .click();
    const breakdown = page.getByRole("dialog", { name: "Participants" });
    await expect(breakdown.getByText("Test user")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(breakdown).toBeHidden();
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
