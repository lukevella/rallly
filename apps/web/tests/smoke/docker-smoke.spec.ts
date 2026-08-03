import { expect, test } from "@playwright/test";

// A crashed client bundle (e.g. env validation running in the browser)
// still serves 200s — only a real browser catches it, by observing the
// uncaught exception and the error boundary replacing the page.

test("unauthenticated visitor gets a working, hydrated login page", async ({
  page,
}) => {
  const clientErrors: Error[] = [];
  page.on("pageerror", (error) => clientErrors.push(error));

  // Straight to /login rather than asserting redirect behavior from "/" —
  // what "/" serves depends on auth and instance state (fresh instances
  // serve guests a page directly), and routing policy isn't what this
  // spec guards.
  await page.goto("/login");

  await expect(page.getByText("Welcome")).toBeVisible();

  // Filling the form proves client JS booted and hydrated — a crashed
  // bundle leaves the error boundary in place of the form.
  await page
    .getByPlaceholder("jessie.smith@example.com")
    .fill("smoke-test@example.com");
  await expect(
    page.getByRole("button", { name: "Continue with email" }),
  ).toBeEnabled();

  expect(clientErrors).toEqual([]);
});
