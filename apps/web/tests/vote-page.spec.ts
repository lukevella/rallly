import type { Locator } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { NewPollPage } from "./new-poll-page";

/**
 * The list row an option sits in, which is what carries its geometry.
 * A grouped list nests rows inside a group item, so this excludes anything
 * holding another row.
 */
function optionRow(main: Locator) {
  // has/hasNot resolve inside each li, so they are built from the page: a
  // locator scoped to main would look for main inside the row.
  const page = main.page();
  return main
    .locator("li")
    .filter({ has: page.getByTestId("poll-option") })
    .filter({ hasNot: page.locator("li") });
}

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
    // The row, not the option cell: the cell holds a time that renders
    // only after hydration, so it has no box until then.
    const optionBox = await box(optionRow(main).first());
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

    // The header carries filters and display settings, never the response
    const header = main.locator("header");
    await expect(header.getByText("Test user")).toHaveCount(0);

    // Time format is its own control beside the time zone, and switching it
    // reformats the options
    const displays = header.getByTestId("display-settings");
    await expect(
      displays.getByRole("radio", { name: "12-hour" }),
    ).toBeVisible();
    const firstRow = main.getByTestId("poll-option").first();
    await expect(firstRow).toContainText("PM");
    await displays.getByRole("radio", { name: "24-hour" }).click();
    await expect(firstRow).not.toContainText("PM");

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
    // naming who voted. Both sit beside the option in its row.
    const votedRow = optionRow(main).first();
    await expect(votedRow).toContainText("Yes");
    await expect(votedRow).toContainText("yes");
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
    const optionBox = await box(optionRow(main).first());
    expect(optionBox.y).toBeGreaterThan(sidebarBox.y + sidebarBox.height - 1);

    // Filters sit on the left of the header and display settings on the
    // right, so the header holds the controls rather than the response
    const header = main.locator("header");
    await expect(header.getByTestId("filters")).toHaveCount(1);
    await expect(header.getByTestId("display-settings")).toBeVisible();
    await expect(header.getByRole("heading", { level: 2 })).toHaveCount(0);

    await context.close();
  });

  test("week view groups times by day and navigates between weeks", async ({
    page,
  }) => {
    await page.goto(voteUrl);
    const main = page.locator("#main-content");
    const footer = main.locator("footer");
    await expect(main.getByTestId("poll-option").first()).toBeVisible();

    await main.getByRole("radio", { name: "Week" }).click();

    // Seven columns whatever the week holds, so the days stay in place
    const columns = main.locator("section section");
    await expect(columns).toHaveCount(7);

    // The first week is the earliest, so there is nothing before it. How
    // many weeks the options span depends on the month they fall in, so
    // walk to the last one and back rather than assuming a count.
    const previous = main.getByRole("button", { name: "Previous week" });
    const next = main.getByRole("button", { name: "Next week" });
    await expect(previous).toBeDisabled();
    let weeks = 1;
    while (await next.isEnabled()) {
      await next.click();
      weeks++;
      expect(weeks).toBeLessThan(6);
    }
    await expect(next).toBeDisabled();
    expect(weeks).toBeGreaterThan(1);
    for (let i = 1; i < weeks; i++) {
      await previous.click();
    }
    await expect(previous).toBeDisabled();

    // Hiding empty days leaves only the days that hold options
    await main.getByRole("button", { name: "Hide empty days" }).click();
    const shown = await columns.count();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(7);
    await main.getByRole("button", { name: "Show empty days" }).click();
    await expect(columns).toHaveCount(7);

    // The views share the form, so a vote cast here survives the switch
    await main
      .getByTestId("vote-selector")
      .first()
      .getByRole("radio", { name: "Yes" })
      .click();
    await expect(footer.getByText("1 yes, 0 if need be")).toBeVisible();
    await main.getByRole("radio", { name: "List" }).click();
    await expect(footer.getByText("1 yes, 0 if need be")).toBeVisible();
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
