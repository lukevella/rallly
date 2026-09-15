import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { createTestPoll, createUserInDb, loginWithEmail } from "./test-utils";

// A poll whose creator was banned is usually a scam lure. The person who
// clicks the link is the intended victim, so the page they land on has to
// warn them instead of showing a generic 404, and none of the poll's content
// may leak through the page. A page opened before the ban must not be able
// to keep writing to the poll either.

const scamTitle = "Claim your unclaimed parcel refund";

async function createPollForUser(suffix: string) {
  const user = await createUserInDb({
    email: `unavailable-${suffix}-${randomUUID()}@example.com`,
    name: "Poll Owner",
  });
  const poll = await createTestPoll({
    id: `unavail-${randomUUID().slice(0, 8)}`,
    title: scamTitle,
    userId: user.id,
    updatedAt: new Date(),
    hasFutureOptions: true,
  });
  return { user, poll };
}

test.describe("unavailable poll invite page", () => {
  test("a banned creator's poll shows the removed page and a scam warning", async ({
    page,
  }) => {
    const { user, poll } = await createPollForUser("banned");

    const main = page.locator("#main-content");

    const voter = await createUserInDb({
      email: `unavailable-voter-${randomUUID()}@example.com`,
      name: "Voter",
    });
    await loginWithEmail(page, { email: voter.email });

    // A response started while the poll was still served, so the ban lands
    // between the page and its submit. The database is the witness: the
    // page may have re-rendered into the removed page by the time the
    // refusal lands.
    await page.goto(`/invite/${poll.id}`);
    await expect(main.getByText(scamTitle).first()).toBeVisible();
    await page.locator("data-testid=vote-selector >> nth=0").click();
    await page.click("button >> text='Continue'");
    await page.type('[placeholder="Jessie Smith"]', "Victim");

    await prisma.user.update({
      where: { id: user.id },
      data: { banned: true, bannedAt: new Date(), banReason: "scam" },
    });

    await page.click("text='Save availability'");
    await expect(page.getByText("Your response has been saved")).toHaveCount(0);
    await expect
      .poll(() => prisma.participant.count({ where: { pollId: poll.id } }))
      .toBe(0);

    await page.goto(`/invite/${poll.id}`);
    await expect(
      main.getByRole("heading", { name: "This poll has been removed" }),
    ).toBeVisible();
    await expect(main.getByRole("alert")).toContainText("suspicious");
    await expect(main.getByText(scamTitle)).toHaveCount(0);
    await expect(page).not.toHaveTitle(scamTitle);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  test("a deleted poll shows the deleted page without the scam warning", async ({
    page,
  }) => {
    const { poll } = await createPollForUser("deleted");

    await prisma.poll.update({
      where: { id: poll.id },
      data: { deleted: true, deletedAt: new Date() },
    });

    const main = page.locator("#main-content");

    await page.goto(`/invite/${poll.id}`);
    await expect(
      main.getByRole("heading", { name: "This poll has been deleted" }),
    ).toBeVisible();
    await expect(main.getByRole("alert")).toHaveCount(0);
    await expect(main.getByText(scamTitle)).toHaveCount(0);
    await expect(page).not.toHaveTitle(scamTitle);
  });

  test("a missing poll is still a 404", async ({ page }) => {
    await page.goto("/invite/does-not-exist");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
  });
});
