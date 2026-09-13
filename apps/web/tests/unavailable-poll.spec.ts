import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { createTestPoll, createUserInDb, loginWithEmail } from "./test-utils";

// A poll whose creator was banned is usually a scam lure. The person who
// clicks the link is the intended victim, so the page they land on has to
// warn them instead of showing a generic 404, and none of the poll's content
// may leak through the page or the public tRPC reads.

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

    await page.goto(`/invite/${poll.id}`);
    await expect(main.getByText(scamTitle).first()).toBeVisible();

    const optionsBeforeBan = await page.request.get(
      `/api/trpc/polls.get?input=${encodeURIComponent(
        JSON.stringify({ json: { urlId: poll.id } }),
      )}`,
    );
    const optionId = (await optionsBeforeBan.json()).result.data.json.options[0]
      .id;
    expect(optionId).toBeTruthy();

    await prisma.user.update({
      where: { id: user.id },
      data: { banned: true, bannedAt: new Date(), banReason: "scam" },
    });

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

    const get = await page.request.get(
      `/api/trpc/polls.get?input=${encodeURIComponent(
        JSON.stringify({ json: { urlId: poll.id } }),
      )}`,
    );
    expect(get.status()).toBe(404);
    const participants = await page.request.get(
      `/api/trpc/polls.participants.list?input=${encodeURIComponent(
        JSON.stringify({ json: { pollId: poll.id } }),
      )}`,
    );
    expect(participants.status()).toBe(404);
    const comments = await page.request.get(
      `/api/trpc/polls.comments.list?input=${encodeURIComponent(
        JSON.stringify({ json: { pollId: poll.id } }),
      )}`,
    );
    expect(comments.status()).toBe(404);

    // Writes are refused too, so a signed-in caller who kept the poll's
    // option ids from before the ban cannot keep adding responses or
    // comments to it.
    const voter = await createUserInDb({
      email: `unavailable-voter-${randomUUID()}@example.com`,
      name: "Voter",
    });
    await loginWithEmail(page, { email: voter.email });
    const addParticipant = await page.request.post(
      "/api/trpc/polls.participants.add",
      {
        data: {
          json: {
            pollId: poll.id,
            name: "Victim",
            votes: [{ optionId: optionId, type: "yes" }],
          },
        },
      },
    );
    expect(addParticipant.status()).toBe(404);
    const addComment = await page.request.post("/api/trpc/polls.comments.add", {
      data: {
        json: { pollId: poll.id, authorName: "Victim", content: "Hello" },
      },
    });
    expect(addComment.status()).toBe(404);
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
