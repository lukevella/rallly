/**
 * Regenerates the landing page hero screenshot from a staged demo poll.
 *
 * With the dev server running:
 *   pnpm --filter @rallly/web capture:hero
 *
 * Set APP_BASE_URL if the dev server is not on http://localhost:3000.
 * The demo poll uses fixed ids, so re-running replaces it.
 */
import path from "node:path";
import { chromium } from "@playwright/test";
import { prisma } from "@rallly/database";

const POLL_ID = "hero-demo-poll";
const USER_ID = "hero-demo-user";
const SPACE_ID = "hero-demo-space";
const TIME_ZONE = "Europe/London";
const BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
const OUTPUT = path.resolve(
  __dirname,
  "../../landing/public/static/images/hero-shot.png",
);

const VIEWPORT = { width: 1440, height: 1152 };

type VoteType = "yes" | "ifNeedBe" | "no";

const participants: { name: string; votes: VoteType[] }[] = [
  {
    name: "Arthur",
    votes: ["ifNeedBe", "yes", "no", "yes", "yes", "yes", "no", "yes"],
  },
  {
    name: "Samantha",
    votes: ["yes", "yes", "yes", "no", "yes", "yes", "no", "yes"],
  },
  {
    name: "Wendy",
    votes: ["yes", "yes", "yes", "yes", "yes", "no", "ifNeedBe", "yes"],
  },
  {
    name: "Joseph",
    votes: ["no", "yes", "no", "yes", "yes", "no", "no", "yes"],
  },
];

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function timeZoneOffsetMs(date: Date) {
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = offset?.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) {
    return 0;
  }
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * HOUR_MS + Number(match[3]) * 60 * 1000);
}

function optionStartTimes() {
  // Four Thursdays starting at least a week out, each with a midday and an
  // evening slot, expressed in the poll's time zone.
  let day = new Date(Date.now() + 7 * DAY_MS);
  while (day.getUTCDay() !== 4) {
    day = new Date(day.getTime() + DAY_MS);
  }
  return [0, 1, 2, 3].flatMap((week) => {
    const thursday = new Date(day.getTime() + week * 7 * DAY_MS);
    return [12, 18].map((hour) => {
      const utcGuess = new Date(
        Date.UTC(
          thursday.getUTCFullYear(),
          thursday.getUTCMonth(),
          thursday.getUTCDate(),
          hour,
        ),
      );
      return new Date(utcGuess.getTime() - timeZoneOffsetMs(utcGuess));
    });
  });
}

async function seed() {
  await prisma.poll.deleteMany({ where: { id: POLL_ID } });

  await prisma.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: {
      id: USER_ID,
      name: "Luke",
      email: "hero-demo@rallly.internal",
      emailVerified: true,
      timeZone: TIME_ZONE,
    },
  });

  await prisma.space.upsert({
    where: { id: SPACE_ID },
    update: {},
    create: { id: SPACE_ID, name: "Personal", ownerId: USER_ID },
  });

  await prisma.poll.create({
    data: {
      id: POLL_ID,
      title: "Monthly Meetup",
      description:
        "Hey everyone, please choose the dates that work best for you!",
      location: "Joe's Coffee Shop",
      status: "open",
      kind: "time",
      timeZone: TIME_ZONE,
      userId: USER_ID,
      spaceId: SPACE_ID,
      disableComments: false,
      createdAt: new Date(Date.now() - 2 * DAY_MS),
    },
  });

  const startTimes = optionStartTimes();
  const optionIds = startTimes.map((_, i) => `${POLL_ID}-option-${i}`);
  await prisma.option.createMany({
    data: startTimes.map((startTime, i) => ({
      id: optionIds[i],
      pollId: POLL_ID,
      startTime,
      duration: 60,
    })),
  });

  for (let p = 0; p < participants.length; p++) {
    const participant = participants[p];
    const participantId = `${POLL_ID}-participant-${p}`;
    await prisma.participant.create({
      data: {
        id: participantId,
        pollId: POLL_ID,
        name: participant.name,
        // The participant list renders newest first; count down so the
        // display order matches the array order above.
        createdAt: new Date(
          Date.now() - 2 * DAY_MS + (participants.length - p) * HOUR_MS,
        ),
      },
    });
    await prisma.vote.createMany({
      data: participant.votes.map((type, i) => ({
        id: `${participantId}-vote-${i}`,
        pollId: POLL_ID,
        participantId,
        optionId: optionIds[i],
        type,
      })),
    });
  }

  await prisma.comment.create({
    data: {
      pollId: POLL_ID,
      authorName: "Samantha",
      content: "Looking forward to see you all!",
      createdAt: new Date(Date.now() - DAY_MS),
    },
  });
}

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    timezoneId: TIME_ZONE,
    locale: "en",
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/invite/${POLL_ID}`, {
    waitUntil: "networkidle",
  });
  await page.getByText("Wendy").waitFor();
  // Dismiss the voting form that opens for new visitors; the hero shows the
  // poll at rest, not a half-completed response.
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.waitForTimeout(1000);

  const main = await page.locator("main").boundingBox();
  if (!main) {
    throw new Error("Could not measure the invite page content");
  }
  const pad = 32;
  await page.screenshot({
    path: OUTPUT,
    clip: {
      x: main.x - pad,
      y: 0,
      width: main.width + pad * 2,
      height: main.y + main.height + pad,
    },
  });
  await browser.close();
}

async function main() {
  await seed();
  console.info("✓ Demo poll seeded");
  await capture();
  console.info(`✓ Screenshot saved to ${OUTPUT}`);
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
