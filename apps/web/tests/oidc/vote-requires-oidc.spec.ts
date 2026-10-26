import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { NewPollPage } from "../new-poll-page";

// Test users provisioned by authentik/blueprints-ci/test-user.yaml.
const ALICE = { username: "alice", password: "alice-ci-password" };
const BOB = {
  username: "bob",
  password: "bob-ci-password",
  name: "Bob Voter",
  email: "bob@example.com",
};

/**
 * Clicks the Authentik button already on the page and completes its login
 * flow. Authentik renders each step as a web component that re-renders while
 * it initialises, so a value typed too early is lost: wait for each step to
 * settle before filling it.
 */
async function signInWithAuthentik(
  page: Page,
  user: { username: string; password: string },
) {
  await page.getByRole("button", { name: "Authentik" }).click();
  await page.waitForURL(/authentik\.localhost/);
  await page.waitForLoadState("networkidle");

  const username = page.locator('input[name="uidField"]');
  await username.waitFor();
  await username.fill(user.username);
  await username.press("Enter");

  const password = page.locator('input[name="password"]');
  await password.waitFor();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  await password.fill(user.password);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/localhost:3000/);
}

test.describe("voting requires an OIDC session", () => {
  test.describe.configure({ mode: "serial" });

  let inviteUrl: string;
  let votePageUrl: string;

  test.beforeAll(async ({ browser }) => {
    // Self-hosted instances do not let guests create polls, so an OIDC user
    // organises it: Alice signs in, finishes onboarding, then creates one.
    const context = await browser.newContext({
      permissions: ["clipboard-read"],
    });
    const page = await context.newPage();
    await page.goto("/login");
    await signInWithAuthentik(page, ALICE);
    // First login lands on the onboarding page; a returning user skips it.
    await page.waitForLoadState("networkidle");
    if (new URL(page.url()).pathname.startsWith("/setup")) {
      await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForURL((url) => !url.pathname.startsWith("/setup"));
    }

    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.create({ name: "OIDC Vote Poll" });
    inviteUrl = (await pollPage.copyInviteLink()).replace(/\?.*$/, "");

    // A user can answer a poll only once, so the /vote page gets its own.
    await newPollPage.goto();
    const secondPoll = await newPollPage.create({
      name: "OIDC Vote Page Poll",
    });
    votePageUrl = `${(await secondPoll.copyInviteLink()).replace(/\?.*$/, "")}/vote`;
    await context.close();
  });

  test("an anonymous visitor sees a sign-in prompt and no vote form", async ({
    page,
  }) => {
    await page.goto(inviteUrl);

    await expect(
      page.getByText(
        "Sign in with your organization account to vote on this poll.",
      ),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Authentik" })).toBeVisible();
    await expect(page.getByTestId("vote-selector")).toHaveCount(0);
  });

  test("an anonymous visitor sees a sign-in prompt and no vote form on the /vote page", async ({
    page,
  }) => {
    await page.goto(votePageUrl);

    await expect(
      page.getByText(
        "Sign in with your organization account to vote on this poll.",
      ),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Authentik" })).toBeVisible();
    await expect(page.getByTestId("vote-selector")).toHaveCount(0);
  });

  test("an OIDC user votes under their identity provider name and email", async ({
    page,
  }) => {
    await page.goto(inviteUrl);
    await signInWithAuthentik(page, BOB);
    await page.waitForURL(/\/invite\//);

    await page.locator("data-testid=vote-selector >> nth=0").click();
    await page.getByRole("button", { name: "Continue" }).click();

    const name = page.getByPlaceholder("Jessie Smith");
    const email = page.getByPlaceholder("jessie.smith@example.com");
    await expect(name).toHaveValue(BOB.name);
    await expect(name).toBeDisabled();
    await expect(email).toHaveValue(BOB.email);
    await expect(email).toBeDisabled();

    await page.click("text='Save availability'");
    await expect(page.getByText("Your response has been saved")).toBeVisible();
    await page.click("button >> text='Back to poll'");
    await expect(page.getByText(BOB.name)).toBeVisible();
  });

  test("an OIDC user votes from the /vote page under their identity provider name and email", async ({
    page,
  }) => {
    await page.goto(votePageUrl);
    await signInWithAuthentik(page, BOB);
    await page.waitForURL(/\/vote/);

    await page
      .getByTestId("vote-selector")
      .first()
      .getByRole("radio", { name: "Yes" })
      .click();
    await page.getByRole("button", { name: "Continue" }).click();

    const name = page.getByPlaceholder("Jessie Smith");
    const email = page.getByPlaceholder("jessie.smith@example.com");
    await expect(name).toHaveValue(BOB.name);
    await expect(name).toBeDisabled();
    await expect(email).toHaveValue(BOB.email);
    await expect(email).toBeDisabled();

    await page.getByRole("button", { name: "Save availability" }).click();
    await expect(page.getByText("Your response has been saved")).toBeVisible();
    await page.getByRole("button", { name: "Back to poll" }).click();
    await expect(page.locator("footer").getByText(BOB.name)).toBeVisible();
  });
});
