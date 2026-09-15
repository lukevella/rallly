import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { NewPollPage } from "./new-poll-page";

// The comment UI is hidden when the host turns comments off. That is a
// presentation choice; these tests pin the server-side rule behind it, so a
// page that still shows the composer cannot write past the setting.
test.describe("comments disabled", () => {
  test("the action rejects a comment once comments are turned off", async ({
    page,
  }) => {
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.create({
      name: "No Comments Meetup",
      enableComments: true,
    });
    await pollPage.closeShareDialog();

    const pollId = page.url().match(/\/poll\/([^/?]+)/)?.[1];
    expect(pollId).toBeTruthy();

    await page.getByRole("button", { name: "Comments" }).click();
    const sheet = page.getByRole("dialog", { name: "Comments" });
    await sheet
      .getByPlaceholder("Write a comment")
      .fill("This comment should be rejected");
    await sheet.getByPlaceholder("Your name…").fill("Test user");

    // Turned off behind the page's back: the composer stays on screen.
    await prisma.poll.update({
      where: { id: pollId },
      data: { disableComments: true },
    });

    await sheet.getByRole("button", { name: "Add comment" }).click();
    await expect(
      page.getByText("Comments are turned off for this poll."),
    ).toBeVisible();
    await expect(sheet.getByText("Your comment has been added")).toHaveCount(0);
    expect(await prisma.comment.count({ where: { pollId } })).toBe(0);

    await page.reload();
    await expect(page.getByRole("button", { name: "Comments" })).toBeHidden();
  });

  test("the action still accepts a comment when comments are on", async ({
    page,
  }) => {
    const newPollPage = new NewPollPage(page);
    await newPollPage.goto();
    const pollPage = await newPollPage.create({
      name: "Comments Allowed Meetup",
      enableComments: true,
    });
    await pollPage.closeShareDialog();

    const pollId = page.url().match(/\/poll\/([^/?]+)/)?.[1];
    expect(pollId).toBeTruthy();

    await pollPage.addComment();
    await expect(
      page.getByTestId("comment").getByText("This is a comment!"),
    ).toBeVisible();
    expect(await prisma.comment.count({ where: { pollId } })).toBe(1);
  });
});
