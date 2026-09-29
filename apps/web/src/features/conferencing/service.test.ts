import { afterEach, describe, expect, it, vi } from "vitest";
import { checkTeamsCanHostMeetings } from "./service";

vi.mock("@/env", () => ({ env: {} }));

const meetingsUrl = "https://graph.microsoft.com/v1.0/me/onlineMeetings";

function respond(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
  });
}

function stubFetch(...outcomes: Array<Response | { rejects: unknown }>) {
  const fetchStub = vi.fn();
  for (const outcome of outcomes) {
    if ("rejects" in outcome) {
      fetchStub.mockRejectedValueOnce(outcome.rejects);
    } else {
      fetchStub.mockResolvedValueOnce(outcome);
    }
  }
  vi.stubGlobal("fetch", fetchStub);
  return fetchStub;
}

describe("checkTeamsCanHostMeetings", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a test meeting and deletes it again", async () => {
    const fetchStub = stubFetch(
      respond(201, { id: "meeting/1" }),
      respond(204),
    );

    expect(await checkTeamsCanHostMeetings({ accessToken: "token" })).toEqual({
      ok: true,
    });
    expect(fetchStub).toHaveBeenCalledTimes(2);
    expect(fetchStub.mock.calls[0]?.[0]).toBe(meetingsUrl);
    expect(fetchStub.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });
    expect(fetchStub.mock.calls[1]?.[0]).toBe(`${meetingsUrl}/meeting%2F1`);
    expect(fetchStub.mock.calls[1]?.[1]).toMatchObject({ method: "DELETE" });
  });

  it("refuses an account Microsoft will not create a meeting for", async () => {
    const fetchStub = stubFetch(
      respond(400, { error: { code: "BadRequest" } }),
    );

    expect(await checkTeamsCanHostMeetings({ accessToken: "token" })).toEqual({
      ok: false,
      reason: "refused",
    });
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it("still refuses when the refusal's body cannot be read", async () => {
    const refusal = respond(403);
    vi.spyOn(refusal, "text").mockRejectedValue(
      new DOMException("The operation timed out.", "TimeoutError"),
    );
    stubFetch(refusal);

    expect(await checkTeamsCanHostMeetings({ accessToken: "token" })).toEqual({
      ok: false,
      reason: "refused",
    });
  });

  it("is inconclusive when Microsoft is unavailable or throttling", async () => {
    stubFetch(respond(503));
    expect(await checkTeamsCanHostMeetings({ accessToken: "token" })).toEqual({
      ok: false,
      reason: "inconclusive",
    });

    stubFetch(respond(429));
    expect(await checkTeamsCanHostMeetings({ accessToken: "token" })).toEqual({
      ok: false,
      reason: "inconclusive",
    });
  });

  it("is inconclusive when the request never completes", async () => {
    stubFetch({
      rejects: new DOMException("The operation timed out.", "TimeoutError"),
    });

    expect(await checkTeamsCanHostMeetings({ accessToken: "token" })).toEqual({
      ok: false,
      reason: "inconclusive",
    });
  });

  it("bounds both requests with an abort signal", async () => {
    const fetchStub = stubFetch(respond(201, { id: "1" }), respond(204));

    await checkTeamsCanHostMeetings({ accessToken: "token" });

    expect(fetchStub.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
    expect(fetchStub.mock.calls[1]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("retries the delete once and still reports the account as able", async () => {
    const fetchStub = stubFetch(
      respond(201, { id: "1" }),
      respond(503),
      respond(204),
    );

    expect(await checkTeamsCanHostMeetings({ accessToken: "token" })).toEqual({
      ok: true,
    });
    expect(fetchStub).toHaveBeenCalledTimes(3);
  });

  it("reports the account as able even when the delete keeps failing", async () => {
    const fetchStub = stubFetch(
      respond(201, { id: "1" }),
      { rejects: new Error("network") },
      respond(500),
    );

    expect(await checkTeamsCanHostMeetings({ accessToken: "token" })).toEqual({
      ok: true,
    });
    expect(fetchStub).toHaveBeenCalledTimes(3);
  });
});
