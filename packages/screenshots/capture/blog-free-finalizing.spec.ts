import type { Locator, Page } from "@playwright/test";
import { test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { deleteAllMessages, loginWithEmail } from "@rallly/test-helpers";
import dayjs from "dayjs";
import { customAlphabet } from "nanoid";
import { blogImagePath } from "./helpers";

const timeZone = "America/New_York";

test.use({ deviceScaleFactor: 2, timezoneId: timeZone });

// The wall clock hour in the poll's time zone, whatever zone this runs in.
function wallTime({ day, hour }: { day: number; hour: number }) {
  const date = dayjs().add(day, "day");
  const guess = Date.UTC(date.year(), date.month(), date.date(), hour);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
    })
      .formatToParts(new Date(guess))
      .map(({ type, value }) => [type, Number(value)]),
  );
  const offset =
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour) - guess;
  return new Date(guess - offset);
}

const pollId = "blog-free-finalizing";

// Mirrors generateAccessToken in apps/web/src/features/poll/utils.ts, which
// this package cannot import. Participant.token has no DB default.
const generateAccessToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  32,
);

const slots = [
  { day: 7, hour: 10 },
  { day: 8, hour: 14 },
  { day: 9, hour: 11 },
  { day: 10, hour: 15 },
];

const participants: {
  name: string;
  email: string;
  votes: ("yes" | "no" | "ifNeedBe")[];
}[] = [
  {
    name: "Sarah Johnson",
    email: "sarah@example.com",
    votes: ["yes", "yes", "no", "ifNeedBe"],
  },
  {
    name: "Michael Chen",
    email: "michael@example.com",
    votes: ["yes", "ifNeedBe", "yes", "no"],
  },
  {
    name: "Emily Rodriguez",
    email: "emily@example.com",
    votes: ["yes", "no", "yes", "yes"],
  },
  {
    name: "David Kim",
    email: "david@example.com",
    votes: ["yes", "yes", "no", "yes"],
  },
  {
    name: "Priya Patel",
    email: "priya@example.com",
    votes: ["yes", "yes", "ifNeedBe", "no"],
  },
];

async function deletePoll() {
  await prisma.poll.deleteMany({ where: { id: pollId } });
}

test.beforeAll(async () => {
  await deleteAllMessages();
  await deletePoll();

  const poll = await prisma.poll.create({
    data: {
      id: pollId,
      title: "Product roadmap review",
      userId: "user-1",
      spaceId: "space-2",
      status: "open",
      timeZone,
      conferencing: { provider: "meet" },
      options: {
        create: slots.map(({ day, hour }) => ({
          startTime: wallTime({ day, hour }),
          duration: 60,
        })),
      },
      participants: {
        create: participants.map(({ name, email }) => ({
          name,
          email,
          token: generateAccessToken(),
        })),
      },
    },
    include: { options: true, participants: true },
  });

  const options = [...poll.options].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );

  await prisma.vote.createMany({
    data: poll.participants.flatMap((participant) => {
      const votes =
        participants.find((p) => p.name === participant.name)?.votes ?? [];
      return options.map((option, i) => ({
        optionId: option.id,
        participantId: participant.id,
        pollId: poll.id,
        type: votes[i] ?? "yes",
      }));
    }),
  });
});

test.afterAll(deletePoll);

async function capture(page: Page, dialog: Locator, name: string) {
  await page.mouse.move(0, 0);
  // The dialog eases its width between steps.
  await page.waitForTimeout(600);
  await page.evaluate(() => document.fonts.ready);
  const box = await dialog.boundingBox();
  if (!box) throw new Error("dialog not visible");
  // One frame size for every step, centred on the dialog, so the images
  // line up in the post and the dialog keeps room around it.
  const width = 880;
  const height = 600;
  await page.screenshot({
    path: blogImagePath(`free-scheduling/${name}`),
    animations: "disabled",
    clip: {
      x: box.x + box.width / 2 - width / 2,
      y: box.y + box.height / 2 - height / 2,
      width,
      height,
    },
  });
}

test("free finalizing blog screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await loginWithEmail(page, { email: "dev@rallly.co" });
  await page.goto(`/poll/${pollId}`);
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "Finalize", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Finalize poll").waitFor();
  await capture(page, dialog, "finalize-results");

  await dialog.locator("button.after\\:absolute").first().click();
  await dialog.getByText("Notify participants").waitFor();
  await capture(page, dialog, "finalize-notify");

  await dialog.getByRole("button", { name: "Next" }).click();
  await dialog.getByText("Google Meet").waitFor();
  await capture(page, dialog, "finalize-summary");
});
