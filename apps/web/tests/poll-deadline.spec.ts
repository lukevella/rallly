import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { NewPollPage } from "./new-poll-page";
import type { PollPage } from "./poll-page";

test.describe
  .serial("poll voting deadline", () => {
    let page: Page;
    let pollPage: PollPage;
    let pollId: string;

    test.beforeAll(async ({ browser }) => {
      page = await (await browser.newContext()).newPage();
      const newPollPage = new NewPollPage(page);
      await newPollPage.goto();
      pollPage = await newPollPage.create({ name: "Deadline Meetup" });
      await pollPage.closeShareDialog();
      pollId = page.url().match(/\/poll\/([^/?]+)/)?.[1] as string;
      expect(pollId).toBeTruthy();
    });

    test("the organizer sets a deadline and voting stays open", async () => {
      await page.getByRole("button", { name: "Manage" }).click();
      await page.getByRole("menuitem", { name: "Voting deadline" }).click();

      const dialog = page.getByRole("dialog", { name: "Voting deadline" });
      await dialog.getByLabel("deadline").fill("2099-01-01T12:00");
      await dialog.getByRole("button", { name: "Save" }).click();
      await expect(dialog).toBeHidden();

      await expect(page.getByTestId("poll-deadline-notice")).toContainText(
        "Voting closes on",
      );
      await pollPage.addParticipant("Anne");
      await expect
        .poll(() => prisma.participant.count({ where: { pollId } }))
        .toBe(1);
    });

    test("a passed deadline hides the voting controls", async () => {
      await prisma.poll.update({
        where: { id: pollId },
        data: { deadline: new Date(Date.now() - 60_000) },
      });
      await page.goto(`/invite/${pollId}`);

      await expect(page.getByTestId("poll-deadline-notice")).toContainText(
        "Voting closed on",
      );
      await expect(page.getByTestId("add-participant-button")).toBeHidden();
    });

    test("a page opened before the deadline cannot vote after it", async () => {
      await prisma.poll.update({
        where: { id: pollId },
        data: { deadline: null },
      });
      await page.goto(`/poll/${pollId}`);
      await page.getByTestId("add-participant-button").click();
      await page.locator("data-testid=vote-selector >> nth=0").click();

      await prisma.poll.update({
        where: { id: pollId },
        data: { deadline: new Date(Date.now() - 60_000) },
      });
      await page.click("button >> text='Continue'");
      await page.type('[placeholder="Jessie Smith"]', "Late voter");
      await page.click("text='Save availability'");

      await page.waitForTimeout(2000);
      expect(await prisma.participant.count({ where: { pollId } })).toBe(1);
    });
  });
