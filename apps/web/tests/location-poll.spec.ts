import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { getCode } from "@rallly/test-helpers";
import { PollPage } from "./poll-page";
import { createUserInDb } from "./test-utils";

const HOST_EMAIL = "location-poll-host@rallly.co";

// A location poll asks participants to vote on a place, not a date. Its
// options have no start time, which every date-shaped part of the app has to
// tolerate: the cron that closes polls whose dates passed, the options list,
// the vote grid and the finalize flow.

test.describe
  .serial("location poll", () => {
    let page: Page;
    let pollPage: PollPage;
    let pollId: string;

    test.beforeAll(async ({ browser }) => {
      // Finalizing is a registered user's action, like booking a date.
      await prisma.user.deleteMany({ where: { email: HOST_EMAIL } });
      await createUserInDb({ email: HOST_EMAIL, name: "Location Host" });

      page = await (await browser.newContext()).newPage();
      page.on("pageerror", (error) => {
        throw error;
      });
    });

    test("the organizer logs in", async () => {
      // The dev server compiles the login routes on the first visit.
      test.setTimeout(180_000);
      await page.goto("/login");
      await page.getByRole("heading", { name: "Welcome" }).first().waitFor();
      await page.getByPlaceholder("jessie.smith@example.com").fill(HOST_EMAIL);
      await page.getByRole("button", { name: "Continue with email" }).click();
      // The first email render compiles its template, which outlasts the
      // shared helper's five second wait, so wait for the code screen here.
      await page
        .getByRole("heading", { name: "Verify your email" })
        .first()
        .waitFor({ timeout: 120_000 });
      await page
        .getByLabel("Enter your 6-digit code")
        .fill(await getCode(HOST_EMAIL));
      await page.waitForURL((url) => !url.pathname.startsWith("/login"));
    });

    test.afterAll(async () => {
      await prisma.poll.deleteMany({ where: { id: pollId } });
      await prisma.user.deleteMany({ where: { email: HOST_EMAIL } });
    });

    test("creating one stores the places, not dates", async () => {
      await page.goto("/new");
      await page.getByLabel(/title|event/i).fill("Where do we eat?");

      // A click that lands before React hydrates is dropped, so retry until
      // the places form shows.
      const firstName = page.getByLabel("Name").first();
      await expect(async () => {
        await page.getByRole("radio", { name: "Location" }).click({
          timeout: 2000,
        });
        await expect(firstName).toBeVisible({ timeout: 2000 });
      }).toPass();

      await firstName.fill("Café du Centre");
      await page.getByLabel("Address").first().fill("12 rue de la Paix, Paris");
      await page
        .getByLabel("Link")
        .first()
        .fill("https://maps.example.com/cafe");

      await page.getByRole("button", { name: "Add place" }).click();
      await page.getByLabel("Name").nth(1).fill("Le Bistrot");

      // Respond with just a name later on.
      await page.getByRole("switch", { name: /require email/i }).click();

      await page.getByRole("button", { name: /^create poll$/i }).click();
      await page.waitForURL(/\/poll\/[^/?]+/);

      pollPage = new PollPage(page);
      await pollPage.closeShareDialog();
      pollId = page.url().match(/\/poll\/([^/?]+)/)?.[1] as string;
      expect(pollId).toBeTruthy();

      const poll = await prisma.poll.findUniqueOrThrow({
        where: { id: pollId },
        select: {
          kind: true,
          timeZone: true,
          options: {
            select: {
              startTime: true,
              duration: true,
              name: true,
              address: true,
              url: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
      expect(poll.kind).toBe("location");
      expect(poll.timeZone).toBeNull();
      expect(poll.options).toEqual([
        {
          startTime: null,
          duration: 0,
          name: "Café du Centre",
          address: "12 rue de la Paix, Paris",
          url: "https://maps.example.com/cafe",
        },
        {
          startTime: null,
          duration: 0,
          name: "Le Bistrot",
          address: null,
          url: null,
        },
      ]);
    });

    test("participants vote on places", async () => {
      await page.getByTestId("add-participant-button").click();
      // The first place is a yes; the second is left alone.
      await page.locator("data-testid=vote-selector >> nth=0").click();
      await page.click("button >> text='Continue'");
      await page.type('[placeholder="Jessie Smith"]', "Anne");
      await page.click("text='Save availability'");
      await expect(
        page.getByText("Your response has been saved"),
      ).toBeVisible();
      await page.click("button >> text='Back to poll'");

      const participant = await prisma.participant.findFirstOrThrow({
        where: { pollId },
        select: { votes: { select: { type: true, option: true } } },
      });
      const yes = participant.votes.filter((vote) => vote.type === "yes");
      expect(yes).toHaveLength(1);
      expect(yes[0].option.name).toBe("Café du Centre");
    });

    test("the places are the columns of the vote grid", async () => {
      // The grid shows once the poll has a response, which the previous test
      // added.
      await expect(page.getByTestId("option-place-name")).toHaveText([
        "Café du Centre",
        "Le Bistrot",
      ]);
      await expect(page.getByText("12 rue de la Paix, Paris")).toBeVisible();
    });

    test("a location poll is not closed by the housekeeping cron", async ({
      request,
      baseURL,
    }) => {
      // The cron closes polls whose options have all ended. A place has no
      // end, so a location poll has to stay open.
      const response = await request.get(
        `${baseURL}/api/house-keeping/auto-close-polls`,
        { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } },
      );
      expect(response.ok()).toBeTruthy();

      const poll = await prisma.poll.findUniqueOrThrow({
        where: { id: pollId },
        select: { status: true },
      });
      expect(poll.status).toBe("open");
    });

    test("finalizing picks the place and closes the poll", async () => {
      await page.goto(`/poll/${pollId}`);
      await page.getByRole("button", { name: "Finalize" }).first().click();

      const dialog = page.getByRole("dialog", { name: "Finalize poll" });
      await expect(dialog.getByTestId("finalize-place")).toHaveCount(2);
      // Anne voted for the Café, so it is ranked first.
      await expect(dialog.getByText("Top choice")).toBeVisible();
      await dialog.getByText("Café du Centre").click();
      await dialog.getByRole("button", { name: "Finalize" }).click();
      await expect(dialog).toBeHidden();

      await expect
        .poll(async () => {
          const poll = await prisma.poll.findUniqueOrThrow({
            where: { id: pollId },
            select: { status: true, closedReason: true, location: true },
          });
          return poll;
        })
        .toEqual({
          status: "closed",
          closedReason: "manual",
          location: "Café du Centre, 12 rue de la Paix, Paris",
        });

      expect(
        await prisma.pollActivity.count({
          where: { pollId, type: "poll_closed" },
        }),
      ).toBe(1);
    });

    test("editing the title keeps it a location poll", async () => {
      await page.goto(`/poll/${pollId}/edit`);
      await page.getByLabel(/title/i).fill("Where do we eat tonight?");
      await page.getByRole("button", { name: "Save" }).click();

      await expect
        .poll(async () => {
          const poll = await prisma.poll.findUniqueOrThrow({
            where: { id: pollId },
            select: { title: true, kind: true },
          });
          return poll;
        })
        .toEqual({ title: "Where do we eat tonight?", kind: "location" });
    });
  });
