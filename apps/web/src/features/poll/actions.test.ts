import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasPollAdminAccess: vi.fn(),
  finalizeLocationPoll: vi.fn(),
  setPollMuted: vi.fn(),
  track: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/cache", () => ({ refresh: mocks.refresh }));
vi.mock("@/features/poll/data", () => ({
  hasPollAdminAccess: mocks.hasPollAdminAccess,
}));
vi.mock("@/features/poll/mutations", () => ({
  finalizeLocationPoll: mocks.finalizeLocationPoll,
  setPollMuted: mocks.setPollMuted,
}));
vi.mock("@/lib/posthog", () => ({
  track: mocks.track,
  identifyGroup: vi.fn(),
}));
// The real client pulls in the environment, auth and rate limiting. A stub
// that hands back the action's handler lets the tests call it with a context.
vi.mock("@/lib/safe-action/server", () => {
  const client = {
    metadata: () => client,
    inputSchema: () => client,
    action: (handler: unknown) => handler,
  };
  return { authActionClient: client };
});

import { finalizeLocationPollAction } from "./actions";

type Handler = (args: {
  ctx: { user: { id: string } };
  parsedInput: { pollId: string; optionId: string };
}) => Promise<unknown>;

const run = () =>
  (finalizeLocationPollAction as unknown as Handler)({
    ctx: { user: { id: "user-1" } },
    parsedInput: { pollId: "poll-1", optionId: "option-1" },
  });

describe("finalizeLocationPollAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasPollAdminAccess.mockResolvedValue(true);
    mocks.finalizeLocationPoll.mockResolvedValue({ ok: true });
  });

  it("finalizes the poll for someone who manages it", async () => {
    await expect(run()).resolves.toEqual({ ok: true });

    expect(mocks.hasPollAdminAccess).toHaveBeenCalledWith("poll-1", "user-1");
    expect(mocks.finalizeLocationPoll).toHaveBeenCalledWith({
      pollId: "poll-1",
      optionId: "option-1",
      userId: "user-1",
    });
    expect(mocks.track).toHaveBeenCalledWith(
      { id: "user-1" },
      expect.objectContaining({ event: "poll_finalize:location_submit" }),
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("refuses anyone who does not manage the poll", async () => {
    mocks.hasPollAdminAccess.mockResolvedValue(false);

    await expect(run()).resolves.toEqual({ ok: false, reason: "forbidden" });

    expect(mocks.finalizeLocationPoll).not.toHaveBeenCalled();
    expect(mocks.track).not.toHaveBeenCalled();
  });

  it("does not track a finalization that failed", async () => {
    mocks.finalizeLocationPoll.mockResolvedValue({
      ok: false,
      reason: "optionNotFound",
    });

    await expect(run()).resolves.toEqual({
      ok: false,
      reason: "optionNotFound",
    });
    expect(mocks.track).not.toHaveBeenCalled();
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
