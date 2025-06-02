import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { deleteAllMessages } from "./mailpit/mailpit";
import { createUserInDb, loginWithEmail } from "./test-utils";

const INITIAL_ADMIN_TEST_EMAIL = "initial.admin@rallly.co";
const REGULAR_USER_EMAIL = "user@example.com";
const SUBSEQUENT_ADMIN_EMAIL = "admin2@example.com";
const OTHER_USER_EMAIL = "other.user@example.com";

test.describe("Admin Setup Page Access", () => {
  test.beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            INITIAL_ADMIN_TEST_EMAIL,
            REGULAR_USER_EMAIL,
            SUBSEQUENT_ADMIN_EMAIL,
            OTHER_USER_EMAIL,
          ],
        },
      },
    });

    await deleteAllMessages();
  });

  test("should redirect unauthenticated user to login page", async ({
    page,
  }) => {
    await page.goto("/admin-setup");
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("should allow access if user is the designated initial admin (and not yet admin role)", async ({
    page,
  }) => {
    await createUserInDb(
      INITIAL_ADMIN_TEST_EMAIL,
      "Initial Admin User",
      "user",
    );
    await loginWithEmail(page, INITIAL_ADMIN_TEST_EMAIL);

    await page.goto("/admin-setup");
    await expect(page).toHaveURL(/.*\/admin-setup/);
    await expect(page.getByText("Are you the admin?")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Make Me Admin" }),
    ).toBeVisible();
  });

  test("should show 'not found' for a regular user (not initial admin, not admin role)", async ({
    page,
  }) => {
    await createUserInDb(REGULAR_USER_EMAIL, "Regular User", "user");
    await loginWithEmail(page, REGULAR_USER_EMAIL);

    await page.goto("/admin-setup");
    await expect(page.getByText("Page not found")).toBeVisible();
  });

  test("should redirect an existing admin user to control-panel", async ({
    page,
  }) => {
    await createUserInDb(SUBSEQUENT_ADMIN_EMAIL, "Existing Admin", "admin");
    await loginWithEmail(page, SUBSEQUENT_ADMIN_EMAIL);

    await page.goto("/admin-setup");
    await expect(page).toHaveURL(/.*\/control-panel/);
  });

  test("should show 'not found' if INITIAL_ADMIN_EMAIL in env is different from user's email", async ({
    page,
  }) => {
    await createUserInDb(OTHER_USER_EMAIL, "Other User", "user");
    await loginWithEmail(page, OTHER_USER_EMAIL);

    await page.goto("/admin-setup");
    await expect(page.getByText("Page not found")).toBeVisible();
  });

  test("initial admin can make themselves admin using the button", async ({
    page,
  }) => {
    await createUserInDb(
      INITIAL_ADMIN_TEST_EMAIL,
      "Initial Admin To Be",
      "user",
    );
    await loginWithEmail(page, INITIAL_ADMIN_TEST_EMAIL);

    await page.goto("/admin-setup");
    await expect(page.getByText("Are you the admin?")).toBeVisible();
    await page.getByRole("button", { name: "Make Me Admin" }).click();

    await expect(page).toHaveURL(/.*\/control-panel/, { timeout: 10000 });

    const user = await prisma.user.findUnique({
      where: { email: INITIAL_ADMIN_TEST_EMAIL },
    });
    expect(user).toBeTruthy();
    expect(user?.role).toBe("admin");
  });
});
