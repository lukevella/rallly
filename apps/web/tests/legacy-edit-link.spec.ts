import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { sealData } from "iron-session";
import { createTestPoll, createUserInDb } from "./test-utils";

/**
 * Confirmation emails sent before responses carried their own token linked
 * to a seal of the guest's user id. Those links stay valid.
 */

const GUEST_EMAIL = "legacy-edit-link-guest@rallly.co";
const POLL_ID = "legacy-edit-link-poll";

async function cleanup() {
  await prisma.poll.deleteMany({ where: { id: POLL_ID } });
  await prisma.user.deleteMany({ where: { email: GUEST_EMAIL } });
}

test.describe("Legacy edit link", () => {
  test.beforeAll(cleanup);
  test.afterAll(cleanup);

  test("a sealed user token still edits the response it was emailed for", async ({
    page,
  }) => {
    const guest = await createUserInDb({
      email: GUEST_EMAIL,
      name: "Legacy Guest",
      isAnonymous: true,
    });
    await createTestPoll({
      id: POLL_ID,
      title: "Legacy Edit Link Poll",
      updatedAt: new Date(),
      hasFutureOptions: true,
    });
    await prisma.participant.create({
      data: {
        pollId: POLL_ID,
        name: "Legacy Guest",
        email: GUEST_EMAIL,
        userId: guest.id,
        token: randomUUID().replace(/-/g, ""),
      },
    });

    const sealed = await sealData(
      { userId: guest.id },
      { password: process.env.SECRET_PASSWORD as string, ttl: 0 },
    );

    await page.goto(`/invite/${POLL_ID}?token=${sealed}`);
    await expect(page.getByTestId("participant-menu")).toBeVisible();
  });
});
