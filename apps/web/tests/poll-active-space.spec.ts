import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import {
  createUserInDb,
  loginWithEmail,
  upgradeSpaceToPro,
} from "./test-utils";

// The active space is the membership selected most recently. A poll admin
// page authorizes against the poll's own space, so a member of two spaces
// can open a poll that belongs to the one that is not active. Opening it
// makes that space active, so the dashboard the viewer returns to is the
// poll's space and not the one they happened to have selected before.

const runId = Date.now().toString(36);
const createdUserIds: string[] = [];

function emailFor(name: string) {
  return `${name.toLowerCase().replace(/\s/g, "-")}-${runId}@example.com`;
}

test.afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
});

test("opening a poll from another space makes that space active", async ({
  page,
}) => {
  const owner = await createUserInDb({
    email: emailFor("Team Owner"),
    name: "Team Owner",
  });
  createdUserIds.push(owner.id);
  const team = await prisma.space.findFirstOrThrow({
    where: { ownerId: owner.id },
  });
  await prisma.space.update({
    where: { id: team.id },
    data: { name: `Marketing ${runId}` },
  });
  await upgradeSpaceToPro({ spaceId: team.id, userId: owner.id, seats: 2 });

  const email = emailFor("Jessie Smith");
  const member = await createUserInDb({ email, name: "Jessie Smith" });
  createdUserIds.push(member.id);

  // The member's own space stays the active one: selected now, the team
  // space long ago.
  await prisma.spaceMember.updateMany({
    where: { userId: member.id },
    data: { lastSelectedAt: new Date() },
  });
  await prisma.spaceMember.create({
    data: {
      spaceId: team.id,
      userId: member.id,
      role: "MEMBER",
      lastSelectedAt: new Date(0),
    },
  });

  const poll = await prisma.poll.create({
    data: {
      id: `active-space-${runId}`,
      title: "Team offsite",
      userId: member.id,
      spaceId: team.id,
      kind: "time",
      options: {
        create: {
          startTime: dayjs().add(1, "day").startOf("hour").toDate(),
          duration: 60,
        },
      },
    },
  });

  await loginWithEmail(page, { email });

  await page.goto(`/poll/${poll.id}`);
  await expect(page).toHaveURL(new RegExp(`/poll/${poll.id}$`));
  await expect(page.getByRole("button", { name: "Manage" })).toBeVisible();

  await page.goto("/polls");
  await expect(
    page.getByRole("button", { name: `Marketing ${runId}` }),
  ).toBeVisible();
});
