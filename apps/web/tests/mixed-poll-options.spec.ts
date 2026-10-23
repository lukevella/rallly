import { expect, test } from "@playwright/test";

test("a restored draft with mixed options keeps the time slots", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // Pin the draft: in dev, StrictMode replays the restore effect after the
    // persist hook has saved the empty form over it.
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key !== "new-poll") {
        setItem.call(this, key, value);
      }
    };
    setItem.call(
      window.sessionStorage,
      "new-poll",
      JSON.stringify({
        view: "month",
        options: [
          { type: "date", date: "2030-01-10" },
          {
            type: "timeSlot",
            start: "2030-01-11T12:00:00",
            end: "2030-01-11T13:00:00",
          },
        ],
      }),
    );
  });
  await page.goto("/new");

  // One day card, for the January 11 time slot; the January 10 date is gone.
  await expect(
    page.getByRole("button", { name: "Add time option" }),
  ).toHaveCount(1);
  await expect(page.locator("div").filter({ hasText: /^Jan11$/ })).toHaveCount(
    1,
  );
});

test.describe("mixed date and time options", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/new");
    await page.getByTitle("Next month").click();
    await page.getByText("10", { exact: true }).first().click();
    await page.getByTestId("all-day-option").click();
    await page.getByRole("tab", { name: "Week view" }).click();
    // The selected date is next month, so any visible day is fine: adding a
    // time slot to an all-day poll is what mixes the options.
    await page
      .locator('[data-slot="event-calendar-day-column"]')
      .first()
      .click();
  });

  test("dismissing the dialog discards the time slot", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await page.getByRole("tab", { name: "Month view" }).click();

    await expect(page.getByTestId("all-day-option")).toBeChecked();
    await expect(
      page.getByRole("button", { name: "Add time option" }),
    ).toBeHidden();
  });

  test("keeping time options drops the dates", async ({ page }) => {
    await page.getByRole("button", { name: "Keep time options" }).click();

    await page.getByRole("tab", { name: "Month view" }).click();

    await expect(page.getByTestId("all-day-option")).not.toBeChecked();
    await expect(
      page.getByRole("button", { name: "Add time option" }),
    ).toBeVisible();
  });
});
