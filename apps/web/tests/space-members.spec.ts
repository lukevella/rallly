import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { getSpaceInviteLink } from "@rallly/test-helpers";
import {
  createUserInDb,
  loginWithEmail,
  upgradeSpaceToPro,
} from "./test-utils";

const runId = Date.now().toString(36);
const createdUserIds: string[] = [];

/**
 * Creates a user whose personal space is upgraded to pro with the given
 * number of seats.
 */
async function createSpaceAdmin({
  name,
  seats,
}: {
  name: string;
  seats: number;
}) {
  const email = `${name.toLowerCase().replace(/\s/g, "-")}-${runId}@example.com`;
  const user = await createUserInDb({ email, name });
  createdUserIds.push(user.id);

  const space = await prisma.space.findFirstOrThrow({
    where: { ownerId: user.id },
  });
  await upgradeSpaceToPro({ spaceId: space.id, userId: user.id, seats });

  return { user, space, email };
}

async function createMemberInDb({
  spaceId,
  name,
}: {
  spaceId: string;
  name: string;
}) {
  const email = `${name.toLowerCase().replace(/\s/g, "-")}-${runId}@example.com`;
  const user = await createUserInDb({ email, name });
  createdUserIds.push(user.id);

  await prisma.spaceMember.create({
    data: {
      spaceId,
      userId: user.id,
      role: "MEMBER",
    },
  });

  return { user, email };
}

function memberRow(page: Page, text: string) {
  return page.getByRole("listitem").filter({ hasText: text });
}

async function gotoMembersSettings(page: Page, email: string) {
  await loginWithEmail(page, { email });
  await page.goto("/settings/members");
  await page.getByRole("heading", { name: "Members" }).waitFor();
}

test.afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: createdUserIds } },
    });
    createdUserIds.length = 0;
  }
});

test.describe("Space members", () => {
  test("admin can invite a member who joins via the emailed link", async ({
    page,
    browser,
  }) => {
    // Two OTP logins plus email roundtrips don't fit the default timeout
    // against a dev server.
    test.setTimeout(90_000);

    const owner = await createSpaceAdmin({ name: "Invite Owner", seats: 3 });
    const inviteeEmail = `invitee-${runId}@example.com`;

    await gotoMembersSettings(page, owner.email);
    await expect(page.getByText("1 of 3 seats used")).toBeVisible();

    await page.getByRole("button", { name: "Invite member" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Email").fill(inviteeEmail);
    await dialog.getByRole("button", { name: "Send invite" }).click();

    await expect(page.getByText("Invitation sent")).toBeVisible();
    await expect(memberRow(page, inviteeEmail)).toBeVisible();
    await expect(
      memberRow(page, inviteeEmail).getByText(`Invited by ${owner.user.name}`),
    ).toBeVisible();

    // Capture the invite email before triggering the invitee's login so
    // the OTP capture doesn't pick it up instead.
    const inviteLink = await getSpaceInviteLink(inviteeEmail);

    const invitee = await createUserInDb({
      email: inviteeEmail,
      name: "Invited Member",
    });
    createdUserIds.push(invitee.id);

    const inviteeContext = await browser.newContext();
    const inviteePage = await inviteeContext.newPage();
    await loginWithEmail(inviteePage, { email: inviteeEmail });
    await inviteePage.goto(inviteLink);
    await inviteePage.getByRole("button", { name: "Accept Invite" }).click();
    await expect(
      inviteePage.getByText("Successfully joined the space!"),
    ).toBeVisible();
    await inviteeContext.close();

    await page.reload();
    await expect(memberRow(page, "Invited Member")).toBeVisible();
    await expect(
      memberRow(page, inviteeEmail).getByText(`Invited by ${owner.user.name}`),
    ).toBeHidden();
    await expect(page.getByText("2 of 3 seats used")).toBeVisible();
  });

  test("admin can cancel a pending invite", async ({ page }) => {
    const owner = await createSpaceAdmin({ name: "Cancel Owner", seats: 3 });
    const inviteeEmail = `cancel-invitee-${runId}@example.com`;

    await prisma.spaceMemberInvite.create({
      data: {
        spaceId: owner.space.id,
        email: inviteeEmail,
        role: "MEMBER",
        inviterId: owner.user.id,
      },
    });

    await gotoMembersSettings(page, owner.email);

    const inviteRow = memberRow(page, inviteeEmail);
    await expect(inviteRow).toBeVisible();
    await inviteRow.getByRole("button", { name: "More options" }).click();
    await page.getByRole("menuitem", { name: "Cancel invite" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByText("Invite canceled successfully")).toBeVisible();
    await expect(inviteRow).toBeHidden();
  });

  test("admin can change a member's role", async ({ page }) => {
    const owner = await createSpaceAdmin({ name: "Role Owner", seats: 3 });
    const member = await createMemberInDb({
      spaceId: owner.space.id,
      name: "Role Member",
    });

    await gotoMembersSettings(page, owner.email);

    const row = memberRow(page, member.email);
    await expect(row.getByText("Member", { exact: true })).toBeVisible();
    await row.getByRole("button", { name: "More options" }).click();
    await page.getByRole("menuitem", { name: "Make admin" }).click();

    await expect(page.getByText("Role changed successfully")).toBeVisible();
    await expect(row.getByText("Admin", { exact: true })).toBeVisible();
  });

  test("admin can remove a member", async ({ page }) => {
    const owner = await createSpaceAdmin({ name: "Remove Owner", seats: 3 });
    const member = await createMemberInDb({
      spaceId: owner.space.id,
      name: "Removable Member",
    });

    await gotoMembersSettings(page, owner.email);
    await expect(page.getByText("2 of 3 seats used")).toBeVisible();

    const row = memberRow(page, member.email);
    await row.getByRole("button", { name: "More options" }).click();
    await page.getByRole("menuitem", { name: "Remove member" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByText("Member removed successfully")).toBeVisible();
    await expect(row).toBeHidden();

    await expect(page.getByText("1 of 3 seats used")).toBeVisible();
  });

  test("invite button is disabled when all seats are used", async ({
    page,
  }) => {
    const owner = await createSpaceAdmin({ name: "Full Owner", seats: 1 });

    await gotoMembersSettings(page, owner.email);

    await expect(page.getByText("1 of 1 seats used")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Invite member" }),
    ).toBeDisabled();
    await expect(
      page.getByText(
        "Increase the number of seats in this space from the billing page.",
      ),
    ).toBeVisible();
  });
});
