import { expect, test } from "@playwright/test";
import { NewPollPage } from "./new-poll-page";

// The comment UI is hidden when the host turns comments off. That is a
// presentation choice; these tests pin the server-side rule behind it, so a
// caller going straight at the mutation cannot write past the setting.
test.describe("comments disabled", () => {
  test("the API rejects a comment on a poll with comments off", async ({
    page,
  }) => {
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    // Comments are off by default, so this poll has disableComments = true.
    const pollPage = await newPollPage.create({ name: "No Comments Meetup" });
    await pollPage.closeShareDialog();

    const pollId = page.url().match(/\/poll\/([^/?]+)/)?.[1];
    expect(pollId).toBeTruthy();

    // page.request shares the page's cookie jar, so this carries the same
    // session the hidden UI would have used.
    const response = await page.request.post("/api/trpc/polls.comments.add", {
      data: {
        json: {
          pollId,
          authorName: "Test User",
          content: "This comment should be rejected",
        },
      },
    });

    expect(response.status()).toBe(403);

    await page.reload();
    await expect(page.getByRole("button", { name: "Comments" })).toBeHidden();
  });

  test("the API still accepts a comment when comments are on", async ({
    page,
  }) => {
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.create({
      name: "Comments Allowed Meetup",
      enableComments: true,
    });
    await pollPage.closeShareDialog();

    const pollId = page.url().match(/\/poll\/([^/?]+)/)?.[1];
    expect(pollId).toBeTruthy();

    const response = await page.request.post("/api/trpc/polls.comments.add", {
      data: {
        json: {
          pollId,
          authorName: "Test User",
          content: "This comment should be accepted",
        },
      },
    });

    expect(response.ok()).toBe(true);
  });
});
