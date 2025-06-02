import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";

import { deleteAllMessages } from "./mailpit/mailpit";
import { createUserInDb, loginWithEmail } from "./test-utils";

const CONTROL_PANEL_NON_ADMIN_EMAIL = "cp-non-admin@rallly.co";
const CONTROL_PANEL_ADMIN_EMAIL = "cp-admin@rallly.co";

test.describe
  .serial("Control Panel Access (/control-panel)", () => {
    test.beforeEach(async () => {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [CONTROL_PANEL_NON_ADMIN_EMAIL, CONTROL_PANEL_ADMIN_EMAIL],
          },
        },
      });
      await deleteAllMessages();
    });

    test("should redirect unauthenticated user to login page", async ({
      page,
    }) => {
      await page.goto("/control-panel");
      await expect(page).toHaveURL("/login?redirectTo=%2Fcontrol-panel");
    });

    test("should show not found for a non-admin user", async ({ page }) => {
      await createUserInDb({
        email: CONTROL_PANEL_NON_ADMIN_EMAIL,
        name: "Control Panel Non-Admin",
        role: "user", // Explicitly 'user' role
      });
      await loginWithEmail(page, { email: CONTROL_PANEL_NON_ADMIN_EMAIL });

      await page.goto("/control-panel");

      await expect(page.getByText("404 not found")).toBeVisible();
    });

    test("should allow an admin user to access the control panel", async ({
      page,
    }) => {
      await createUserInDb({
        email: CONTROL_PANEL_ADMIN_EMAIL,
        name: "Control Panel Admin",
        role: "admin",
      });
      await loginWithEmail(page, { email: CONTROL_PANEL_ADMIN_EMAIL });

      await page.goto("/control-panel");
      await expect(page).toHaveURL("/control-panel");

      await expect(
        page.getByRole("heading", { name: "Control Panel" }),
      ).toBeVisible();
    });
  });
