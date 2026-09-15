import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { NewPollPage } from "./new-poll-page";
import type { PollPage } from "./poll-page";

// The client hides the voting controls once a poll leaves "open"
// (`canAddNewParticipant` / `canEditParticipant`). These tests pin the
// server-side rule behind that: a page opened while the poll was open goes
// stale when the organizer closes it, and every write it can still send has
// to be refused by the action. The database is the witness; the page may or
// may not have re-rendered by the time the refusal lands, so nothing here
// depends on what it shows afterwards.

test.describe
  .serial("writes to a closed poll", () => {
    let page: Page;
    let pollPage: PollPage;
    let pollId: string;
    let participantId: string;

    const closePoll = () =>
      prisma.poll.update({
        where: { id: pollId },
        data: { status: "closed", closedReason: "manual" },
      });

    // Each test starts from an open poll and a freshly loaded page, so the
    // controls it needs are on screen before the poll is closed behind it.
    const reopenPoll = async () => {
      await prisma.poll.update({
        where: { id: pollId },
        data: { status: "open", closedReason: null },
      });
      await page.goto(`/poll/${pollId}`);
      await expect(page.getByTestId("participant-row")).toBeVisible();
    };

    const row = () => page.getByTestId("participant-row").first();

    test.beforeAll(async ({ browser }) => {
      page = await (await browser.newContext()).newPage();
      const newPollPage = new NewPollPage(page);
      await newPollPage.goto();
      pollPage = await newPollPage.create({ name: "Closed Poll Meetup" });
      await pollPage.closeShareDialog();
      pollId = page.url().match(/\/poll\/([^/?]+)/)?.[1] as string;
      expect(pollId).toBeTruthy();

      // A response added while the poll is open, so the edit paths below have
      // a real target that only the poll's status disqualifies.
      await pollPage.addParticipant("Anne");
      const participant = await prisma.participant.findFirstOrThrow({
        where: { pollId },
      });
      participantId = participant.id;
    });

    test("a rename is refused", async () => {
      await reopenPoll();
      await row().getByTestId("participant-menu").click();
      await page.getByRole("menuitem", { name: "Change name" }).click();
      const dialog = page.getByRole("dialog", { name: "Change name" });
      await dialog.getByLabel("Name").fill("Renamed");

      await closePoll();
      await dialog.getByRole("button", { name: "Save" }).click();

      await expect(
        page.getByText("No more responses are being accepted.").first(),
      ).toBeVisible();
      await expect
        .poll(async () => {
          const participant = await prisma.participant.findUniqueOrThrow({
            where: { id: participantId },
          });
          return participant.name;
        })
        .toBe("Anne");
    });

    test("a vote change is refused", async () => {
      await reopenPoll();
      const before = await prisma.vote.findMany({
        where: { participantId },
        orderBy: { optionId: "asc" },
      });
      await row().getByTestId("participant-menu").click();
      await page.getByRole("menuitem", { name: "Edit votes" }).click();

      await closePoll();
      await page.getByRole("button", { name: "Save", exact: true }).click();

      await expect(
        page.getByText("No more responses are being accepted.").first(),
      ).toBeVisible();
      const after = await prisma.vote.findMany({
        where: { participantId },
        orderBy: { optionId: "asc" },
      });
      expect(after).toEqual(before);
    });

    test("a delete is refused", async () => {
      await reopenPoll();
      await row().getByTestId("participant-menu").click();
      await page.getByRole("menuitem", { name: "Delete" }).click();
      const dialog = page.getByRole("dialog", { name: "Delete Anne?" });

      await closePoll();
      await dialog.getByRole("button", { name: "Delete" }).click();

      await expect(
        page.getByText("No more responses are being accepted.").first(),
      ).toBeVisible();
      expect(
        await prisma.participant.count({ where: { id: participantId } }),
      ).toBe(1);
    });

    test("a new response is refused", async () => {
      await reopenPoll();
      await page.getByTestId("add-participant-button").click();
      await page.locator("data-testid=vote-selector >> nth=0").click();
      await page.click("button >> text='Continue'");
      await page.type('[placeholder="Jessie Smith"]', "Late");

      await closePoll();
      await page.click("text='Save availability'");

      await expect(
        page.getByText("This poll is no longer accepting responses."),
      ).toBeVisible();
      expect(await prisma.participant.count({ where: { pollId } })).toBe(1);
    });

    test("a response is still accepted while the poll is open", async () => {
      await reopenPoll();
      await pollPage.addParticipant("Ben");
      await expect(
        page.getByTestId("participant-row").filter({ hasText: "Ben" }),
      ).toBeVisible();
      expect(await prisma.participant.count({ where: { pollId } })).toBe(2);
    });
  });
