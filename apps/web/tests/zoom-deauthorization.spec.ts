import { createHmac } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { createUserInDb } from "./test-utils";

const runId = Date.now().toString(36);
const endpoint = "/api/integrations/zoom/deauthorize";

function sign({ body, timestamp }: { body: string; timestamp: string }) {
  const secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!secretToken) {
    throw new Error("ZOOM_WEBHOOK_SECRET_TOKEN is required to sign events");
  }
  return `v0=${createHmac("sha256", secretToken)
    .update(`v0:${timestamp}:${body}`)
    .digest("hex")}`;
}

async function postZoomEvent(
  request: APIRequestContext,
  payload: unknown,
  { signature }: { signature?: string } = {},
) {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  return request.post(endpoint, {
    data: body,
    headers: {
      "content-type": "application/json",
      "x-zm-request-timestamp": timestamp,
      "x-zm-signature": signature ?? sign({ body, timestamp }),
    },
  });
}

async function seedZoomConnection({
  userId,
  zoomUserId,
}: {
  userId: string;
  zoomUserId: string;
}) {
  const credential = await prisma.credential.create({
    data: {
      userId,
      provider: "zoom",
      providerAccountId: zoomUserId,
      type: "OAUTH",
      secret: "encrypted",
      scopes: ["meeting:write:meeting"],
    },
  });
  await prisma.conferencingConnection.create({
    data: {
      userId,
      provider: "zoom",
      integrationId: "zoom",
      providerAccountId: zoomUserId,
      email: `organizer-${runId}@zoom.example`,
      displayName: "Zoom",
      credentialId: credential.id,
    },
  });
}

async function countZoomRows(zoomUserId: string) {
  const where = { provider: "zoom", providerAccountId: zoomUserId };
  return {
    connections: await prisma.conferencingConnection.count({ where }),
    credentials: await prisma.credential.count({ where }),
  };
}

test.describe("Zoom deauthorization endpoint", () => {
  const zoomUserId = `zoom-user-${runId}`;
  let userIds: string[] = [];

  test.beforeEach(async () => {
    const users = await Promise.all(
      ["a", "b"].map((suffix) =>
        createUserInDb({
          email: `zoom-deauth-${suffix}-${runId}@example.com`,
          name: "Organizer",
        }),
      ),
    );
    userIds = users.map((user) => user.id);
    for (const userId of userIds) {
      await seedZoomConnection({ userId, zoomUserId });
    }
  });

  test.afterEach(async () => {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  });

  test("answers the URL validation challenge", async ({ request }) => {
    const res = await postZoomEvent(request, {
      event: "endpoint.url_validation",
      event_ts: Date.now(),
      payload: { plainToken: "qgg8vlvZRS6UYooatFL8Aw" },
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({
      plainToken: "qgg8vlvZRS6UYooatFL8Aw",
      encryptedToken: createHmac(
        "sha256",
        process.env.ZOOM_WEBHOOK_SECRET_TOKEN ?? "",
      )
        .update("qgg8vlvZRS6UYooatFL8Aw")
        .digest("hex"),
    });
  });

  test("a mis-signed event gets 401 and changes nothing", async ({
    request,
  }) => {
    const res = await postZoomEvent(
      request,
      {
        event: "app_deauthorized",
        payload: { user_id: zoomUserId, account_id: "account" },
      },
      { signature: `v0=${"0".repeat(64)}` },
    );
    expect(res.status()).toBe(401);
    expect(await countZoomRows(zoomUserId)).toEqual({
      connections: 2,
      credentials: 2,
    });
  });

  test("a signed app_deauthorized event removes every connection and credential for that Zoom user, orphaned ones included", async ({
    request,
  }) => {
    const otherZoomUserId = `other-zoom-user-${runId}`;
    await seedZoomConnection({
      userId: userIds[0],
      zoomUserId: otherZoomUserId,
    });
    // What a disconnect used to leave behind: the credential without its
    // connection.
    await prisma.conferencingConnection.deleteMany({
      where: { userId: userIds[1] },
    });

    const res = await postZoomEvent(request, {
      event: "app_deauthorized",
      event_ts: Date.now(),
      payload: {
        account_id: "account",
        user_id: zoomUserId,
        signature: "unused",
        deauthorization_time: new Date().toISOString(),
        client_id: "test-zoom",
      },
    });
    expect(res.status()).toBe(200);
    expect(await countZoomRows(zoomUserId)).toEqual({
      connections: 0,
      credentials: 0,
    });
    expect(await countZoomRows(otherZoomUserId)).toEqual({
      connections: 1,
      credentials: 1,
    });
  });

  test("a late event keeps a connection made after the deauthorization", async ({
    request,
  }) => {
    const deauthorizedAt = new Date(Date.now() - 60_000);
    // Only the second user's rows predate the deauthorization; the first
    // user reconnected since, which rewrote theirs.
    const before = { updatedAt: new Date(deauthorizedAt.getTime() - 60_000) };
    await prisma.conferencingConnection.updateMany({
      where: { userId: userIds[1] },
      data: before,
    });
    await prisma.credential.updateMany({
      where: { userId: userIds[1] },
      data: before,
    });

    const res = await postZoomEvent(request, {
      event: "app_deauthorized",
      payload: {
        user_id: zoomUserId,
        deauthorization_time: deauthorizedAt.toISOString(),
      },
    });
    expect(res.status()).toBe(200);
    expect(await countZoomRows(zoomUserId)).toEqual({
      connections: 1,
      credentials: 1,
    });
    expect(
      await prisma.conferencingConnection.count({
        where: { userId: userIds[0] },
      }),
    ).toBe(1);
  });

  test("an event for an unknown Zoom user is still acknowledged", async ({
    request,
  }) => {
    const res = await postZoomEvent(request, {
      event: "app_deauthorized",
      payload: {
        account_id: "account",
        user_id: `unknown-${runId}`,
        deauthorization_time: new Date().toISOString(),
      },
    });
    expect(res.status()).toBe(200);
  });
});
