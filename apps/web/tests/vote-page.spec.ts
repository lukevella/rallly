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

    // Saved: the footer names the response and offers Edit, the prompt
    // goes away, and the controls give way to the recorded votes
    await expect(bar.getByText("Test user")).toBeVisible();
    await expect(bar.getByRole("button", { name: "Edit" })).toBeVisible();

    // The header is display settings only, so the prompt is gone and the
    // response is not there either
    const header = main.locator("header");
    await expect(
      header.getByText("Please select as many times as possible"),
    ).toHaveCount(0);
    await expect(header.getByText("Test user")).toHaveCount(0);

    // Edit opens the form for editing and stops there. Save replaces Edit
    // in the same slot, so if the two footers share DOM nodes the pointer
    // release lands on Save and the response saves as editing begins.
    const submits = await page.evaluate(() => {
      const state = { count: 0 };
      (window as unknown as { __submits: typeof state }).__submits = state;
      document.querySelector("#vote-form")?.addEventListener("submit", () => {
        state.count++;
      });
      return true;
    });
    expect(submits).toBe(true);

    await bar.getByRole("button", { name: "Edit" }).click();
    await expect(bar.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByTestId("vote-selector").first()).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { __submits: { count: number } }).__submits
            .count,
      ),
    ).toBe(0);

    await bar.getByRole("button", { name: "Cancel" }).click();
    await expect(bar.getByRole("button", { name: "Edit" })).toBeVisible();

    // Renaming and deleting live in the overflow menu, so changing a
    // response to a no is the prominent path
    await expect(bar.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await bar.getByTestId("participant-menu").click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem")).toHaveText([
      "Change name",
      "Delete",
    ]);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("vote-selector")).toHaveCount(0);

    // The saved yes shows as a vote icon, and the tally counts it without
    // naming who voted
    const votedRow = main.getByTestId("poll-option").first();
    await expect(votedRow).toContainText("Yes");
    await expect(votedRow).toContainText("yes");
  });

  test("mobile stacks the header, the event and the list", async ({
    browser,
  }) => {
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

    // The prompt and the display controls take a line each, rather than
    // sitting side by side and squeezing the prompt to three lines
    const header = main.locator("header");
    const promptBox = await box(header.getByRole("heading", { level: 2 }));
    const controlsBox = await box(header.getByTestId("display-settings"));
    expect(controlsBox.y).toBeGreaterThan(promptBox.y + promptBox.height - 1);

    await context.close();
  });
});

test.describe("vote page calendar view", () => {
  let voteUrl: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.create({
      name: "Vote Page Dates",
      allDay: true,
    });
    const inviteUrl = await pollPage.copyInviteLink();
    voteUrl = `${inviteUrl.replace(/\?.*$/, "")}/vote`;
    await page.close();
  });

  test("keeps the selection when switching views", async ({ page }) => {
    await page.goto(voteUrl);
    const main = page.locator("#main-content");
    const footer = main.locator("footer");

    // A new response starts as a no on every date
    await expect(footer.getByText("0 yes, 0 if need be")).toBeVisible();

    // Vote in the list, then switch to the calendar
    await main
      .getByTestId("vote-selector")
      .first()
      .getByRole("radio", { name: "Yes" })
      .click();
    await expect(footer.getByText("1 yes, 0 if need be")).toBeVisible();

    await main.getByRole("radio", { name: "Calendar" }).click();
    await expect(main.getByRole("grid")).toBeVisible();

    // The vote survives the switch, and the day carries its own icon.
    // Only the poll's own days show one, so this skips the inert days.
    await expect(footer.getByText("1 yes, 0 if need be")).toBeVisible();
    const days = main
      .getByRole("gridcell")
      .getByRole("button")
      .filter({ has: page.getByRole("img") });
    await expect(days.first().getByRole("img", { name: "Yes" })).toBeVisible();

    // Clicking a day advances it through the vote types
    const next = days.nth(1);
    await next.click();
    await expect(footer.getByText("2 yes, 0 if need be")).toBeVisible();
    await next.click();
    await expect(footer.getByText("1 yes, 1 if need be")).toBeVisible();

    // And back in the list, the calendar's votes are there
    await main.getByRole("radio", { name: "List" }).click();
    await expect(footer.getByText("1 yes, 1 if need be")).toBeVisible();
  });
});
