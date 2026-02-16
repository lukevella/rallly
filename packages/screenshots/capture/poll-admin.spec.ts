import { test } from "@playwright/test";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import { loginWithEmail, screenshotPath } from "./helpers";

const pollId = "screenshot-poll";

test.beforeAll(async () => {
  const existingPoll = await prisma.poll.findUnique({
    where: { id: pollId },
  });

  if (existingPoll) {
    await prisma.poll.delete({ where: { id: pollId } });
  }

  await prisma.poll.create({
    data: {
      id: pollId,
      title: "Q1 Planning Session",
      description:
        "Let's find a time to discuss our goals and priorities for the upcoming quarter.",
      location: "Conference Room A",
      userId: "pro-user",
      spaceId: "space-2",
      status: "open",
      timeZone: "America/New_York",
      adminUrlId: "screenshot-admin",
      participantUrlId: "screenshot-participant",
      options: {
        create: [
          {
            startTime: dayjs().add(7, "day").hour(9).minute(0).second(0).toDate(),
            duration: 60,
          },
          {
            startTime: dayjs().add(8, "day").hour(14).minute(0).second(0).toDate(),
            duration: 60,
          },
          {
            startTime: dayjs().add(10, "day").hour(10).minute(0).second(0).toDate(),
            duration: 60,
          },
        ],
      },
      participants: {
        create: [
          { name: "Sarah Johnson", email: "sarah@example.com" },
          { name: "Michael Chen", email: "michael@example.com" },
          { name: "Emily Rodriguez", email: "emily@example.com" },
        ],
      },
    },
    include: { options: true, participants: true },
  });

  // Add votes for each participant
  const poll = await prisma.poll.findUniqueOrThrow({
    where: { id: pollId },
    include: { options: true, participants: true },
  });

  const votePatterns: Record<string, ("yes" | "no" | "ifNeedBe")[]> = {
    "Sarah Johnson": ["yes", "ifNeedBe", "yes"],
    "Michael Chen": ["yes", "yes", "no"],
    "Emily Rodriguez": ["ifNeedBe", "yes", "yes"],
  };

  for (const participant of poll.participants) {
    const votes = votePatterns[participant.name] ?? ["yes", "yes", "yes"];
    await prisma.vote.createMany({
      data: poll.options.map((option, i) => ({
        id: `screenshot-vote-${participant.id}-${option.id}`,
        optionId: option.id,
        participantId: participant.id,
        pollId: poll.id,
        type: votes[i],
      })),
    });
  }
});

test.afterAll(async () => {
  await prisma.poll.delete({ where: { id: pollId } }).catch(() => {});
});

test("poll admin", async ({ page }) => {
  await loginWithEmail(page, "dev+pro@rallly.co");
  await page.goto(`/poll/${pollId}`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: screenshotPath("poll-admin"),
    fullPage: true,
  });
});
