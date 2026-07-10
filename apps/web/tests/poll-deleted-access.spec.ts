import type { APIRequestContext } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";

/**
 * Regression test for the deleted-poll data exposure: once a poll is soft
 * deleted, its data must not be readable by an unauthenticated caller through
 * the public tRPC read endpoints (polls.get, polls.participants.list,
 * polls.comments.list).
 */
test.describe("Deleted poll access control", () => {
  const PARTICIPANT_EMAIL = "deleted-poll-participant@example.com";
  const COMMENT_CONTENT = "secret comment on a deleted poll";
  const POLL_TITLE = "Deleted Poll Secret Title";

  const createdPollIds: string[] = [];

  async function createPoll(id: string, deleted: boolean) {
    const poll = await prisma.poll.create({
      data: {
        id,
        title: POLL_TITLE,
        description: "confidential description",
        participantUrlId: `${id}-participant`,
        adminUrlId: `${id}-admin`,
        deleted,
        deletedAt: deleted ? new Date() : null,
        options: {
          create: { startTime: new Date(), duration: 60 },
        },
        participants: {
          create: {
            name: "Deleted Poll Participant",
            email: PARTICIPANT_EMAIL,
          },
        },
        comments: {
          create: {
            content: COMMENT_CONTENT,
            authorName: "Commenter",
          },
        },
      },
    });
    createdPollIds.push(poll.id);
    return poll;
  }

  test.afterAll(async () => {
    if (createdPollIds.length > 0) {
      await prisma.poll.deleteMany({ where: { id: { in: createdPollIds } } });
    }
  });

  // Unauthenticated GET against a single tRPC query, superjson-encoded.
  async function trpcQuery(
    request: APIRequestContext,
    baseURL: string | undefined,
    procedure: string,
    input: Record<string, unknown>,
  ) {
    const encoded = encodeURIComponent(JSON.stringify({ json: input }));
    const response = await request.get(
      `${baseURL}/api/trpc/${procedure}?input=${encoded}`,
    );
    return { status: response.status(), text: await response.text() };
  }

  test("hides a deleted poll from unauthenticated callers", async ({
    request,
    baseURL,
  }) => {
    const poll = await createPoll("deleted-poll-access", true);

    const get = await trpcQuery(request, baseURL, "polls.get", {
      urlId: poll.id,
    });
    expect(get.status).toBe(404);
    expect(get.text).not.toContain(POLL_TITLE);

    const participants = await trpcQuery(
      request,
      baseURL,
      "polls.participants.list",
      { pollId: poll.id },
    );
    expect(participants.status).toBe(404);
    expect(participants.text).not.toContain(PARTICIPANT_EMAIL);

    const comments = await trpcQuery(request, baseURL, "polls.comments.list", {
      pollId: poll.id,
    });
    // comments.list mirrors a non-existent poll by returning an empty list
    // rather than erroring, so a deleted poll leaks no comment content.
    expect(comments.status).toBe(200);
    expect(comments.text).not.toContain(COMMENT_CONTENT);
  });

  test("still serves a live poll to unauthenticated callers", async ({
    request,
    baseURL,
  }) => {
    const poll = await createPoll("live-poll-access", false);

    const get = await trpcQuery(request, baseURL, "polls.get", {
      urlId: poll.id,
    });
    expect(get.status).toBe(200);
    expect(get.text).toContain(POLL_TITLE);

    const comments = await trpcQuery(request, baseURL, "polls.comments.list", {
      pollId: poll.id,
    });
    expect(comments.status).toBe(200);
    expect(comments.text).toContain(COMMENT_CONTENT);
  });
});
