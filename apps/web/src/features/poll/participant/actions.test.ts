import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv, mockAddParticipant } = vi.hoisted(() => ({
  mockEnv: { REQUIRE_AUTH_TO_VOTE: "false" },
  mockAddParticipant: vi.fn(),
}));

vi.mock("@/env", () => ({ env: mockEnv }));
vi.mock("@/features/poll/participant/mutations", () => ({
  addParticipant: mockAddParticipant,
}));
vi.mock("@/i18n/server/get-locale", () => ({
  getLocale: vi.fn().mockResolvedValue("en"),
}));
vi.mock("@/lib/rate-limit", () => ({
  createRateLimitGuard: () => async () => {},
}));
vi.mock("@rallly/logger", () => ({ createLogger: () => ({}) }));

// The safe-action clients validate the whole environment on import. Replace
// them with a builder that hands back the handler, so it can be called with
// a context and an already parsed input.
vi.mock("@/lib/safe-action/server", () => {
  const client: Record<string, unknown> = {};
  client.metadata = () => client;
  client.use = () => client;
  client.inputSchema = () => client;
  client.action = (handler: unknown) => handler;
  return {
    anyUserActionClient: client,
    optionalUserActionClient: client,
    createRateLimitMiddleware: vi.fn(),
  };
});

// Everything else the module imports is only used after a response is saved.
vi.mock("@rallly/emails/templates/new-participant", () => ({}));
vi.mock("@rallly/emails/templates/new-participant-confirmation", () => ({}));
vi.mock("@rallly/utils/absolute-url", () => ({}));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/emails/branding", () => ({}));
vi.mock("@/features/billing/utils", () => ({}));
vi.mock("@/features/email-budget/mutations", () => ({}));
vi.mock("@/features/email-budget/service", () => ({}));
vi.mock("@/features/notifications/data", () => ({}));
vi.mock("@/features/notifications/utils", () => ({}));
vi.mock("@/features/poll/data", () => ({}));
vi.mock("@/features/poll/invite/utils", () => ({}));
vi.mock("@/lib/effect/runtime", () => ({}));
vi.mock("@/lib/posthog", () => ({}));

import { addParticipantAction } from "./actions";

type Handler = (args: {
  ctx: { event: Record<string, unknown>; user: unknown };
  parsedInput: unknown;
}) => Promise<unknown>;

const run = (user: unknown) =>
  (addParticipantAction as unknown as Handler)({
    ctx: { event: {}, user },
    parsedInput: {
      pollId: "poll-1",
      name: "Mallory",
      email: "mallory@example.com",
      votes: [],
    },
  });

const guest = {
  id: "g1",
  isGuest: true,
  name: "Guest",
  email: "g@example.com",
};
const member = {
  id: "u1",
  isGuest: false,
  name: "Ada Lovelace",
  email: "ada@idp.test",
};

describe("addParticipantAction voter policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.REQUIRE_AUTH_TO_VOTE = "false";
    mockAddParticipant.mockResolvedValue({ ok: false, reason: "closed" });
  });

  it("refuses a guest when authentication is required to vote", async () => {
    mockEnv.REQUIRE_AUTH_TO_VOTE = "true";

    await expect(run(guest)).resolves.toEqual({
      ok: false,
      reason: "authRequired",
    });
    expect(mockAddParticipant).not.toHaveBeenCalled();
  });

  it("binds the response to the signed-in account and its identity", async () => {
    mockEnv.REQUIRE_AUTH_TO_VOTE = "true";

    await run(member);

    expect(mockAddParticipant).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        name: "Ada Lovelace",
        email: "ada@idp.test",
      }),
    );
  });

  it("keeps guest voting when authentication is not required", async () => {
    await run(guest);

    expect(mockAddParticipant).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "g1", name: "Mallory" }),
    );
  });
});
