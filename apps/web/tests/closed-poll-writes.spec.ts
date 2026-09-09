import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { NewPollPage } from "./new-poll-page";

// The client hides the voting form once a poll leaves "open"
// (`canAddNewParticipant` / `canEditParticipant`). These tests pin the
// server-side rule behind that, so a caller reaching the mutations directly
// cannot write to a poll whose voting window the organizer has ended.

async function getPollId(page: Page) {
  const pollId = page.url().match(/\/poll\/([^/?]+)/)?.[1];
  expect(pollId).toBeTruthy();
  return pollId as string;
}

async function closePoll(page: Page, pollId: string) {
  const response = await page.request.post("/api/trpc/polls.close", {
    data: { json: { pollId } },
  });
  expect(response.ok()).toBe(true);
}

test.describe("writes to a closed poll", () => {
  test("the API rejects a new response once the poll is closed", async ({
    page,
  }) => {
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.create({ name: "Closed Poll Meetup" });
    await pollPage.closeShareDialog();
    const pollId = await getPollId(page);

    // A response added while the poll is still open, so the edit paths below
    // have a real target that only the poll's status disqualifies.
    await pollPage.addParticipant("Anne");
    const participants = await page.request.get(
      `/api/trpc/polls.participants.list?input=${encodeURIComponent(
        JSON.stringify({ json: { pollId } }),
      )}`,
    );
    expect(participants.ok()).toBe(true);
    const participantId = (await participants.json()).result.data.json[0].id;
    expect(participantId).toBeTruthy();

    await closePoll(page, pollId);

    const options = await page.request.get(
      `/api/trpc/polls.get?input=${encodeURIComponent(
        JSON.stringify({ json: { urlId: pollId } }),
      )}`,
    );
    const optionId = (await options.json()).result.data.json.options[0].id;

    const add = await page.request.post("/api/trpc/polls.participants.add", {
      data: {
        json: {
          pollId,
          name: "Test Participant",
          votes: [{ optionId, type: "yes" }],
        },
      },
    });
    expect(add.status()).toBe(400);

    // The same rule has to hold for every write path that reaches an existing
    // response, not just the one the report named.
    const update = await page.request.post(
      "/api/trpc/polls.participants.update",
      {
        data: {
          json: { pollId, participantId, votes: [{ optionId, type: "no" }] },
        },
      },
    );
    expect(update.status()).toBe(400);

    const rename = await page.request.post(
      "/api/trpc/polls.participants.rename",
      { data: { json: { participantId, newName: "Renamed" } } },
    );
    expect(rename.status()).toBe(400);

    const remove = await page.request.post(
      "/api/trpc/polls.participants.delete",
      { data: { json: { participantId } } },
    );
    expect(remove.status()).toBe(400);
  });

  test("the API still accepts a response while the poll is open", async ({
    page,
  }) => {
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.create({ name: "Open Poll Meetup" });
    await pollPage.closeShareDialog();
    const pollId = await getPollId(page);

    const options = await page.request.get(
      `/api/trpc/polls.get?input=${encodeURIComponent(
        JSON.stringify({ json: { urlId: pollId } }),
      )}`,
    );
    const optionId = (await options.json()).result.data.json.options[0].id;

    const add = await page.request.post("/api/trpc/polls.participants.add", {
      data: {
        json: {
          pollId,
          name: "Test Participant",
          votes: [{ optionId, type: "yes" }],
        },
      },
    });
    expect(add.ok()).toBe(true);
  });
});
