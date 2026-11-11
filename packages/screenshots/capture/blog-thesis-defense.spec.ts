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

const pollId = "blog-thesis-defense";

// Mirrors generateAccessToken in apps/web/src/features/poll/utils.ts, which
// this package cannot import. Participant.token has no DB default.
const generateAccessToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  32,
);

// Six options on six days, starting from the first Monday at least eight
// weeks out, so no option lands on a weekend.
const firstDay = 56 + ((8 - dayjs().add(56, "day").day()) % 7);

const slots = [
  { day: firstDay, hour: 9 },
  { day: firstDay + 1, hour: 14 },
  { day: firstDay + 3, hour: 9 },
  { day: firstDay + 7, hour: 9 },
  { day: firstDay + 8, hour: 14 },
  { day: firstDay + 10, hour: 9 },
];

const participants: {
  name: string;
  email: string;
  votes: ("yes" | "no" | "ifNeedBe")[];
}[] = [
  {
    name: "Aisha Rahman",
    email: "aisha@example.com",
    votes: ["yes", "yes", "yes", "yes", "yes", "yes"],
  },
  {
    name: "Elena Marsh",
    email: "elena@example.com",
    votes: ["yes", "no", "yes", "yes", "ifNeedBe", "no"],
  },
  {
    name: "Daniel Okafor",
    email: "daniel@example.com",
    votes: ["no", "yes", "ifNeedBe", "yes", "yes", "yes"],
  },
  {
    name: "Mei Tanaka",
    email: "mei@example.com",
    votes: ["yes", "yes", "no", "ifNeedBe", "no", "yes"],
  },
  {
    name: "Lars Holm",
    email: "lars@example.com",
    votes: ["no", "no", "yes", "yes", "yes", "no"],
  },
];

const organizerId = "user-1";
let organizerName: string | undefined;

async function deletePoll() {
  await prisma.poll.deleteMany({ where: { id: pollId } });
}

test.beforeAll(async () => {
  await deleteAllMessages();
  await deletePoll();

  // The poll page names its organizer; the seeded name reads as a test account.
  const organizer = await prisma.user.findUniqueOrThrow({
    where: { id: organizerId },
    select: { name: true },
  });
  organizerName = organizer.name;
  await prisma.user.update({
    where: { id: organizerId },
    data: { name: "Grace Whitfield" },
  });

  const poll = await prisma.poll.create({
    data: {
      id: pollId,
      title: "PhD defense, Biology",
      description:
        "Please mark every time you could attend. The defense lasts two hours, including deliberation. Please respond by Friday.",
      location: "Room 2.14, Life Sciences Building",
      userId: organizerId,
      spaceId: "space-2",
      status: "open",
      timeZone,
      requireParticipantEmail: true,
      options: {
        create: slots.map(({ day, hour }) => ({
          startTime: wallTime({ day, hour }),
          duration: 120,
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

test.afterAll(async () => {
  await deletePoll();
  if (organizerName !== undefined) {
    await prisma.user.update({
      where: { id: organizerId },
      data: { name: organizerName },
    });
  }
});

// Three weekdays in the week after next, picked from the month the calendar
// opens on.
function optionDays() {
  const monday = dayjs().add(14 - ((dayjs().day() + 6) % 7), "day");
  return [0, 1, 3].map((offset) => monday.add(offset, "day").date());
}

test("thesis defense blog screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1040, height: 860 });
  await loginWithEmail(page, { email: "dev@rallly.co" });

  await page.goto("/new");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Title").fill("PhD defense, Biology");
  await page.getByRole("radio", { name: "2h", exact: true }).click();
  for (const day of optionDays()) {
    await page.getByText(String(day), { exact: true }).last().click();
  }
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: blogImagePath("thesis-defense/create-poll"),
    animations: "disabled",
  });

  await page.goto(`/poll/${pollId}`);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: blogImagePath("thesis-defense/responses"),
    animations: "disabled",
  });

  await page.getByRole("button", { name: "Finalize", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Finalize poll").waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  const box = await dialog.boundingBox();
  if (!box) throw new Error("dialog not visible");
  const width = 880;
  const height = 560;
  await page.screenshot({
    path: blogImagePath("thesis-defense/finalize"),
    animations: "disabled",
    clip: {
      x: Math.max(0, box.x + box.width / 2 - width / 2),
      y: box.y + box.height / 2 - height / 2,
      width,
      height,
    },
  });
});
