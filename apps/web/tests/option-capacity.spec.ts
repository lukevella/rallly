import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { NewPollPage } from "./new-poll-page";
import type { PollPage } from "./poll-page";

test.describe
  .serial("yes vote cap per option", () => {
    let page: Page;
    let pollPage: PollPage;
    let pollId: string;
    let participantId: string;

    const yesVotesOnFullestOption = async () => {
      const counts = await prisma.vote.groupBy({
        by: ["optionId"],
        where: { pollId, type: "yes" },
        _count: { _all: true },
      });
      return Math.max(0, ...counts.map(({ _count }) => _count._all));
    };

    test.beforeAll(async ({ browser }) => {
      page = await (await browser.newContext()).newPage();
      const newPollPage = new NewPollPage(page);
      await newPollPage.goto();
      pollPage = await newPollPage.create({ name: "Workshop with one place" });
      await pollPage.closeShareDialog();
      pollId = page.url().match(/\/poll\/([^/?]+)/)?.[1] as string;
      expect(pollId).toBeTruthy();

      await prisma.poll.update({
        where: { id: pollId },
        data: { maxYesVotesPerOption: 1 },
      });
      await page.reload();
    });

    test("a yes is accepted while the option has room", async () => {
      await pollPage.addParticipant("Anne");
      const participant = await prisma.participant.findFirstOrThrow({
        where: { pollId },
      });
      participantId = participant.id;
      expect(await yesVotesOnFullestOption()).toBe(1);
    });

    test("a yes on a full option is refused", async () => {
      await page.getByTestId("add-participant-button").click();
      await page.locator("data-testid=vote-selector >> nth=0").click();
      await page.click("button >> text='Continue'");
      await page.type('[placeholder="Jessie Smith"]', "Ben");
      await page.click("text='Save availability'");

      await expect(
        page.getByText('An option you said "yes" to is full.'),
      ).toBeVisible();
      expect(await prisma.participant.count({ where: { pollId } })).toBe(1);
      expect(await yesVotesOnFullestOption()).toBe(1);
    });

    test("re-saving your own yes on a full option is accepted", async () => {
      await page.goto(`/poll/${pollId}`);
      const row = page.getByTestId("participant-row").first();
      await row.getByTestId("participant-menu").click();
      await page.getByRole("menuitem", { name: "Edit votes" }).click();
      await page.getByRole("button", { name: "Save", exact: true }).click();

      await expect(
        page.getByText('An option you said "yes" to is full.'),
      ).toBeHidden();
      await expect
        .poll(() =>
          prisma.vote.count({ where: { participantId, type: "yes" } }),
        )
        .toBe(2);
      expect(await yesVotesOnFullestOption()).toBe(1);
    });
  });
