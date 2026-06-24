import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";

let eventId: string;

test.beforeAll(async () => {
  const user = await prisma.user.upsert({
    where: { email: "event-test@example.com" },
    update: {},
    create: {
      email: "event-test@example.com",
      name: "Test Organizer",
      locale: "en",
      timeZone: "Europe/London",
      emailVerified: true,
    },
  });

  if (!(await prisma.space.findFirst({ where: { ownerId: user.id } }))) {
    await prisma.space.create({
      data: { name: "Personal", ownerId: user.id, tier: "hobby" },
    });
  }
  const space = await prisma.space.findFirst({ where: { ownerId: user.id } });

  const event = await prisma.scheduledEvent.create({
    data: {
      title: "Test Event",
      userId: user.id,
      spaceId: space!.id,
      start: new Date("2030-01-15T09:00:00Z"),
      end: new Date("2030-01-15T10:00:00Z"),
      uid: `test-event-uid-${Date.now()}`,
      status: "confirmed",
    },
  });

  eventId = event.id;
});

test("should display event title and action buttons", async ({ page }) => {
  await page.goto(`/e/${eventId}`);
  await expect(page.locator("h1")).toContainText("Test Event");
  await expect(page.getByText("Upcoming")).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Decline" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add to Calendar" }),
  ).toBeVisible();
});

test("should open calendar dropdown when clicking Add to Calendar", async ({
  page,
}) => {
  await page.goto(`/e/${eventId}`);
  await page.getByRole("button", { name: "Add to Calendar" }).click();
  await expect(page.getByText("Google Calendar")).toBeVisible();
  await expect(page.getByText("Microsoft 365")).toBeVisible();
  await expect(page.getByText("Download ICS File")).toBeVisible();
});

test("should show 404 for invalid event ID", async ({ page }) => {
  await page.goto("/e/invalid-id-999");
  await expect(page.locator("text=404")).toBeVisible();
});
