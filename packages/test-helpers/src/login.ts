import type { Page } from "@playwright/test";

import { getCode } from "./email";

export async function loginWithEmail(
  page: Page,
  { email, password }: { email: string; password?: string },
) {
  await page.goto("/login");
  await page.getByText("Welcome").waitFor();

  await page.getByPlaceholder("jessie.smith@example.com").fill(email);
  await page.getByRole("button", { name: "Continue with email" }).click();

  if (password) {
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Login with password" }).click();
  } else {
    const code = await getCode(email);
    await page.getByRole("heading", { name: "Finish Logging In" }).waitFor();
    await page.getByPlaceholder("Enter your 6-digit code").fill(code);
  }

  await page.waitForLoadState("networkidle");
}
