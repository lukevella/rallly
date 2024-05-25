/**
 * Sample Playwright test,
 * accesses the [baseUrl]/demo path,
 * expects the page to have the title "Polls"
 */
import { test, expect } from '@playwright/test';

// access demo page, expect the title to be "Polls"
test('has title', async ({ page }) => {
    await page.goto('/demo');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Polls/);
});

