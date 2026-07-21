import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only before any imports that might need it
vi.mock("server-only", () => ({}));

const mockDeletePoll = vi.fn();
const mockCreatePoll = vi.fn();
const mockClosePoll = vi.fn();
const mockGetPollResults = vi.fn();
const mockGetPollParticipants = vi.fn();
const mockListPolls = vi.fn();

vi.mock("@/features/poll/mutations", () => ({
  deletePoll: (...args: unknown[]) => mockDeletePoll(...args),
  createPoll: (...args: unknown[]) => mockCreatePoll(...args),
  closePoll: (...args: unknown[]) => mockClosePoll(...args),
}));

vi.mock("@/features/poll/data", () => ({
  getPollResults: (...args: unknown[]) => mockGetPollResults(...args),
  getPollParticipants: (...args: unknown[]) => mockGetPollParticipants(...args),
  listPolls: (...args: unknown[]) => mockListPolls(...args),
}));

vi.mock("@rallly/database", () => ({
  prisma: {
    spaceApiKey: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    spaceMember: {
      findFirst: vi.fn(),
    },
    poll: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@rallly/utils/absolute-url", () => ({
  absoluteUrl: (path: string) => `https://example.com${path}`,
  shortUrl: (path: string) => `https://example.com${path}`,
}));

vi.mock("@rallly/utils/nanoid", () => ({
  nanoid: () => "test-poll-id",
}));

vi.mock("next/server", () => ({
  after: vi.fn(),
}));

vi.mock("@/lib/kv", () => ({
  redis: null,
}));

import { prisma } from "@rallly/database";
import { after } from "next/server";
import { hashApiKey, verifyApiKey } from "@/features/api-keys/utils";
import {
  createPollRequestExamples,
  patchPollRequestExamples,
} from "../examples";
import {
  createPollInputSchema,
  createPollSuccessResponseSchema,
  deletePollSuccessResponseSchema,
  getPollParticipantsSuccessResponseSchema,
  getPollResultsSuccessResponseSchema,
  getPollSuccessResponseSchema,
  listPollsSuccessResponseSchema,
  patchPollSuccessResponseSchema,
} from "../schemas";
import { RATE_LIMIT_PER_MINUTE } from "../utils/rate-limit";
import { app } from "./route";

const expectMatchesContract = (
  schema: {
    safeParse: (data: unknown) => { success: boolean; error?: unknown };
  },
  body: unknown,
) => {
  const result = schema.safeParse(body);
  expect(result.error).toBeUndefined();
  expect(result.success).toBe(true);
};

// Pre-generated test API key fixture. The stored hash deliberately uses the
// deprecated scrypt format so every test in this file exercises the legacy
// verification path that existing production keys depend on.
const testApiKey = "sk_eXzkd84Y_bN24KFwZ_UyiQ0b6zckpNfL2pSdng3r3";
const mockApiKey = {
  id: "api-key-id",
  name: "Test API Key",
  prefix: "eXzkd84Y",
  spaceId: "test-space-id",
  hashedKey:
    "scrypt$16384$8$1$AvCRsm3--6zUOTmMdmM5Jg$4fe1f6de88b70ed9f78aa89752e632cc6ff628194dd42bd34a8cf8e71b23e19ba23ceb9c6371f6eed9129a8afee81bdad8b5b31351162178e2a8b68381102940",
  lastUsedAt: null,
  expiresAt: null,
  revokedAt: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  space: {
    ownerId: "test-user-id",
    tier: "pro",
  },
};

describe("Private API - /polls", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock findMany for the timing-safe lookup
    vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([mockApiKey]);
    vi.mocked(prisma.spaceApiKey.findUnique).mockResolvedValue(mockApiKey);
    vi.mocked(prisma.spaceApiKey.update).mockResolvedValue({} as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "test-user-id",
    } as never);
    vi.mocked(prisma.spaceMember.findFirst).mockResolvedValue(null);

    // Mock createPoll mutation
    mockCreatePoll.mockResolvedValue({
      id: "test-poll-id",
      title: "Test Poll",
      description: null,
      location: null,
      timeZone: null,
      status: "open",
      createdAt: new Date("2025-01-10T12:00:00Z"),
      user: {
        name: "Test User",
        image: null,
      },
      options: [],
      adminUrl: "https://example.com/poll/test-poll-id",
      inviteUrl: "https://example.com/invite/test-poll-id",
    });
  });

  describe("Authentication", () => {
    it("should return 401 without authorization header", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Poll",
          dates: ["2025-01-15"],
        }),
      });

      expect(res.status).toBe(401);
    });

    it("should return 401 with invalid API key", async () => {
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([]);

      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid_key",
        },
        body: JSON.stringify({
          title: "Test Poll",
          dates: ["2025-01-15"],
        }),
      });

      expect(res.status).toBe(401);
    });

    it("should return 401 with revoked API key", async () => {
      // Revoked keys are filtered out by the database query
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([]);

      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Test Poll",
          dates: ["2025-01-15"],
        }),
      });

      expect(res.status).toBe(401);
    });

    it("should return 401 with expired API key", async () => {
      // Expired keys are filtered out by the database query
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([]);

      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Test Poll",
          dates: ["2025-01-15"],
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe("Pro tier enforcement", () => {
    it("should return 403 with SPACE_NOT_PRO when the space is not pro", async () => {
      const hobbyApiKey = {
        ...mockApiKey,
        space: { ...mockApiKey.space, tier: "hobby" },
      };
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([hobbyApiKey]);

      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Test Poll",
          dates: ["2025-01-15"],
        }),
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe("SPACE_NOT_PRO");
    });

    it("should not schedule a lastUsedAt write when the space is not pro", async () => {
      const hobbyApiKey = {
        ...mockApiKey,
        hashedKey: hashApiKey(testApiKey),
        lastUsedAt: null,
        space: { ...mockApiKey.space, tier: "hobby" },
      };
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([hobbyApiKey]);

      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Test Poll",
          dates: ["2025-01-15"],
        }),
      });

      expect(res.status).toBe(403);
      expect(after).not.toHaveBeenCalled();
    });

    it("should return 200 with a valid key when the space is pro", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Test Poll",
          dates: ["2025-01-15"],
        }),
      });

      expect(res.status).toBe(200);
    });
  });

  describe("lastUsedAt throttling", () => {
    it("should not schedule a write when lastUsedAt is recent", async () => {
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([
        {
          ...mockApiKey,
          hashedKey: hashApiKey(testApiKey),
          lastUsedAt: new Date(Date.now() - 30_000),
        },
      ]);

      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).not.toBe(401);
      expect(after).not.toHaveBeenCalled();
    });

    it("should schedule a write when lastUsedAt is stale", async () => {
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([
        {
          ...mockApiKey,
          hashedKey: hashApiKey(testApiKey),
          lastUsedAt: new Date(Date.now() - 120_000),
        },
      ]);

      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).not.toBe(401);
      expect(after).toHaveBeenCalledTimes(1);
    });

    it("should schedule a write when lastUsedAt is null", async () => {
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([
        {
          ...mockApiKey,
          hashedKey: hashApiKey(testApiKey),
          lastUsedAt: null,
        },
      ]);

      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).not.toBe(401);
      expect(after).toHaveBeenCalledTimes(1);
    });

    it("should still re-hash a legacy key when lastUsedAt is recent", async () => {
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([
        {
          ...mockApiKey,
          lastUsedAt: new Date(Date.now() - 30_000),
        },
      ]);

      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).not.toBe(401);
      expect(after).toHaveBeenCalledTimes(1);
    });
  });

  describe("Hash migration (scrypt -> sha256)", () => {
    // The lastUsedAt/re-hash update runs in an after() callback; invoke the
    // captured callbacks to simulate the post-response phase
    const flushAfterCallbacks = async () => {
      for (const [callback] of vi.mocked(after).mock.calls) {
        await (callback as () => Promise<unknown>)();
      }
    };

    it("should authenticate a legacy scrypt-hashed key and re-hash it to sha256", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Test Poll",
          dates: ["2025-01-15"],
        }),
      });

      expect(res.status).toBe(200);
      await flushAfterCallbacks();

      expect(prisma.spaceApiKey.update).toHaveBeenCalledWith({
        where: { id: mockApiKey.id },
        data: expect.objectContaining({
          hashedKey: expect.stringMatching(/^sha256\$/),
        }),
      });

      // The re-hashed value must still verify the original key
      const updateCall = vi.mocked(prisma.spaceApiKey.update).mock.calls[0];
      const newHash = updateCall?.[0]?.data?.hashedKey as string;
      expect(await verifyApiKey(testApiKey, newHash)).toBe(true);
    });

    it("should authenticate a sha256-hashed key without re-hashing", async () => {
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([
        { ...mockApiKey, hashedKey: hashApiKey(testApiKey) },
      ]);

      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Test Poll",
          dates: ["2025-01-15"],
        }),
      });

      expect(res.status).toBe(200);
      await flushAfterCallbacks();

      expect(prisma.spaceApiKey.update).toHaveBeenCalledWith({
        where: { id: mockApiKey.id },
        data: { lastUsedAt: expect.any(Date) },
      });
    });
  });

  describe("Create poll with dates", () => {
    it("should create a poll with date options", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Team offsite",
          dates: ["2025-01-15", "2025-01-16", "2025-01-17"],
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(createPollSuccessResponseSchema, json);
      expect(json.data.id).toBe("test-poll-id");
      expect(json.data.adminUrl).toBe("https://example.com/poll/test-poll-id");
      expect(json.data.inviteUrl).toBe(
        "https://example.com/invite/test-poll-id",
      );

      expect(mockCreatePoll).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Team offsite",
          options: [
            {
              startTime: new Date("2025-01-15T00:00:00.000Z"),
              duration: 0,
            },
            {
              startTime: new Date("2025-01-16T00:00:00.000Z"),
              duration: 0,
            },
            {
              startTime: new Date("2025-01-17T00:00:00.000Z"),
              duration: 0,
            },
          ],
        }),
      );
    });

    it("should save location when provided", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Team offsite",
          location: "Conference Room A",
          dates: ["2025-01-15"],
        }),
      });

      expect(res.status).toBe(200);
      expect(mockCreatePoll).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Team offsite",
          location: "Conference Room A",
        }),
      );
    });

    it("should return error when too many date options", async () => {
      const dates = Array.from({ length: 101 }, (_, i) => {
        const date = new Date(2025, 0, 1 + i);
        return date.toISOString().split("T")[0];
      });

      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Test Poll",
          dates,
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("TOO_MANY_OPTIONS");
    });

    it("should return error when duplicate dates are provided", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Test Poll",
          dates: ["2025-01-15", "2025-01-16", "2025-01-15", "2025-01-17"],
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("DUPLICATE_DATES");
      expect(json.error.message).toContain("Duplicate dates found");
    });
  });

  describe("Create poll with slots", () => {
    it("should create a poll with time slot options", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Team sync",
          slots: {
            duration: 30,
            timezone: "Europe/London",
            times: ["2025-01-15T09:00:00Z", "2025-01-15T10:00:00Z"],
          },
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(createPollSuccessResponseSchema, json);
      expect(json.data.id).toBe("test-poll-id");

      expect(mockCreatePoll).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Team sync",
          timeZone: "Europe/London",
        }),
      );
    });

    it("should create poll without timezone when not provided in request", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Team sync",
          slots: {
            duration: 30,
            times: ["2025-01-15T09:00:00Z"],
          },
        }),
      });

      expect(res.status).toBe(200);
      expect(mockCreatePoll).toHaveBeenCalledWith(
        expect.objectContaining({
          timeZone: undefined,
        }),
      );
    });

    it("should return error for invalid timezone", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Team sync",
          slots: {
            duration: 30,
            timezone: "Invalid/Timezone",
            times: ["2025-01-15T09:00:00Z"],
          },
        }),
      });

      expect(res.status).toBe(400);
    });

    it("should create poll with slot generator", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Weekly standup",
          slots: {
            duration: 30,
            timezone: "Europe/London",
            times: [
              {
                startDate: "2025-01-20",
                endDate: "2025-01-22",
                days: ["mon", "tue", "wed"],
                startTime: "09:00",
                endTime: "10:00",
              },
            ],
          },
        }),
      });

      expect(res.status).toBe(200);
      expect(mockCreatePoll).toHaveBeenCalled();
    });
  });

  describe("Validation", () => {
    it("should return error when neither dates nor slots provided", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Test Poll",
        }),
      });

      expect(res.status).toBe(400);
    });

    it("should return error when both dates and slots provided", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Test Poll",
          dates: ["2025-01-15"],
          slots: {
            duration: 30,
            timezone: "Europe/London",
            times: ["2025-01-15T09:00:00Z"],
          },
        }),
      });

      expect(res.status).toBe(400);
    });

    it("should return error when title is missing", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          dates: ["2025-01-15"],
        }),
      });

      expect(res.status).toBe(400);
    });

    it("should return error when dates array is empty", async () => {
      const res = await app.request("/api/private/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Test Poll",
          dates: [],
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("OpenAPI endpoints", () => {
    it("should return OpenAPI spec", async () => {
      const res = await app.request("/api/private/openapi");

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.info.title).toBe("Rallly Private API");
    });

    it("should include create poll request examples that match the input schema", async () => {
      const res = await app.request("/api/private/openapi");

      expect(res.status).toBe(200);
      const json = await res.json();
      const media =
        json.paths["/api/private/polls"].post.requestBody.content[
          "application/json"
        ];
      expect(Object.keys(media.examples)).toEqual(
        Object.keys(createPollRequestExamples),
      );

      for (const example of Object.values(createPollRequestExamples)) {
        const result = createPollInputSchema.safeParse(example.value);
        expect(result.error).toBeUndefined();
        expect(result.success).toBe(true);
      }
    });

    it("should document the close poll transition on PATCH /polls/{pollId}", async () => {
      const res = await app.request("/api/private/openapi");

      expect(res.status).toBe(200);
      const json = await res.json();
      const operation = json.paths["/api/private/polls/{pollId}"].patch;

      expect(operation.summary).toBeDefined();
      expect(operation.description).toContain("closed");
      expect(Object.keys(operation.responses)).toEqual(
        expect.arrayContaining(["200", "403", "404", "422", "429"]),
      );

      const media = operation.requestBody.content["application/json"];
      expect(Object.keys(media.examples)).toEqual(
        Object.keys(patchPollRequestExamples),
      );
    });

    it("should return docs page", async () => {
      const res = await app.request("/api/private/docs");

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/html");
    });
  });

  describe("Patch poll (close)", () => {
    const closedPoll = {
      id: "test-poll-id",
      title: "Test Poll",
      description: null,
      location: null,
      timeZone: null,
      status: "closed",
      createdAt: new Date("2025-01-10T12:00:00Z"),
      user: { name: "Test User", image: null },
      options: [],
    };

    it("should close an open poll", async () => {
      mockClosePoll.mockResolvedValue(closedPoll);

      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "closed" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(patchPollSuccessResponseSchema, json);
      expect(json.data.id).toBe("test-poll-id");
      expect(json.data.status).toBe("closed");

      expect(mockClosePoll).toHaveBeenCalledWith({
        pollId: "test-poll-id",
        spaceId: "test-space-id",
      });
    });

    it("should be idempotent when the poll is already closed", async () => {
      mockClosePoll.mockResolvedValue(closedPoll);

      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "closed" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe("closed");
    });

    it("should return 404 when the poll is not found", async () => {
      mockClosePoll.mockResolvedValue(null);

      const res = await app.request("/api/private/polls/nonexistent-poll", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "closed" }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("POLL_NOT_FOUND");
      expect(mockClosePoll).toHaveBeenCalled();
    });

    it.each([
      "open",
      "scheduled",
      "canceled",
    ])("should return 422 when transitioning to %s", async (status) => {
      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error.code).toBe("TRANSITION_NOT_AVAILABLE");
      expect(mockClosePoll).not.toHaveBeenCalled();
    });

    it("should return 400 for an unknown status value", async () => {
      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "archived" }),
      });

      expect(res.status).toBe(400);
      expect(mockClosePoll).not.toHaveBeenCalled();
    });

    it("should return 401 without authorization", async () => {
      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "closed" }),
      });

      expect(res.status).toBe(401);
      expect(mockClosePoll).not.toHaveBeenCalled();
    });
  });

  describe("Delete poll", () => {
    it("should delete a poll", async () => {
      mockDeletePoll.mockResolvedValue({ id: "test-poll-id" });

      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(deletePollSuccessResponseSchema, json);
      expect(json.data.id).toBe("test-poll-id");
      expect(json.data.deleted).toBe(true);

      expect(mockDeletePoll).toHaveBeenCalledWith(
        "test-poll-id",
        "test-space-id",
      );
    });

    it("should return 404 when poll not found", async () => {
      mockDeletePoll.mockResolvedValue(null);

      const res = await app.request("/api/private/polls/nonexistent-poll", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("POLL_NOT_FOUND");
    });

    it("should return 404 when poll belongs to different space", async () => {
      mockDeletePoll.mockResolvedValue(null);

      const res = await app.request("/api/private/polls/other-space-poll", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("POLL_NOT_FOUND");
    });

    it("should return 401 without authorization", async () => {
      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "DELETE",
      });

      expect(res.status).toBe(401);
    });

    it("should return 404 when poll is already deleted", async () => {
      mockDeletePoll.mockResolvedValue(null);

      const res = await app.request("/api/private/polls/deleted-poll-id", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("POLL_NOT_FOUND");
    });
  });

  describe("Get poll", () => {
    const mockPoll = {
      id: "test-poll-id",
      title: "Team sync",
      description: "Weekly team meeting",
      location: "Zoom",
      timeZone: "Europe/London",
      status: "open",
      createdAt: new Date("2025-01-10T12:00:00Z"),
      user: {
        name: "John Doe",
        image: "https://example.com/avatar.jpg",
      },
      options: [
        {
          id: "opt-1",
          startTime: new Date("2025-01-15T09:00:00Z"),
          duration: 30,
        },
        {
          id: "opt-2",
          startTime: new Date("2025-01-15T10:00:00Z"),
          duration: 30,
        },
      ],
    };

    it("should return poll data", async () => {
      vi.mocked(prisma.poll.findFirst).mockResolvedValue(mockPoll as never);

      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(getPollSuccessResponseSchema, json);
      expect(json.data.id).toBe("test-poll-id");
      expect(json.data.title).toBe("Team sync");
      expect(json.data.description).toBe("Weekly team meeting");
      expect(json.data.location).toBe("Zoom");
      expect(json.data.timezone).toBe("Europe/London");
      expect(json.data.status).toBe("open");
      expect(json.data.createdAt).toBe("2025-01-10T12:00:00.000Z");
      expect(json.data.user).toEqual({
        name: "John Doe",
        image: "https://example.com/avatar.jpg",
      });
      expect(json.data.options).toHaveLength(2);
      expect(json.data.options[0]).toEqual({
        id: "opt-1",
        startTime: "2025-01-15T09:00:00.000Z",
        duration: 30,
      });
      expect(json.data.adminUrl).toBe("https://example.com/poll/test-poll-id");
      expect(json.data.inviteUrl).toBe(
        "https://example.com/invite/test-poll-id",
      );

      expect(prisma.poll.findFirst).toHaveBeenCalledWith({
        where: {
          id: "test-poll-id",
          spaceId: "test-space-id",
          deleted: false,
        },
        select: expect.objectContaining({
          id: true,
          title: true,
          description: true,
          location: true,
          timeZone: true,
          status: true,
          createdAt: true,
          user: expect.any(Object),
          options: expect.any(Object),
        }),
      });
    });

    it("should return poll without user when user is null", async () => {
      vi.mocked(prisma.poll.findFirst).mockResolvedValue({
        ...mockPoll,
        user: null,
      } as never);

      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.user).toBeNull();
    });

    it("should return 404 when poll not found", async () => {
      vi.mocked(prisma.poll.findFirst).mockResolvedValue(null);

      const res = await app.request("/api/private/polls/nonexistent-poll", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("POLL_NOT_FOUND");
    });

    it("should return 404 when poll belongs to different space", async () => {
      vi.mocked(prisma.poll.findFirst).mockResolvedValue(null);

      const res = await app.request("/api/private/polls/other-space-poll", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("POLL_NOT_FOUND");
    });

    it("should return 401 without authorization", async () => {
      const res = await app.request("/api/private/polls/test-poll-id", {
        method: "GET",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("List polls", () => {
    const mockListedPoll = {
      id: "test-poll-id",
      title: "Team sync",
      description: "Weekly team meeting",
      location: "Zoom",
      timeZone: "Europe/London",
      status: "open",
      createdAt: new Date("2025-01-10T12:00:00Z"),
      user: {
        name: "John Doe",
        image: null,
      },
      options: [
        {
          id: "opt-1",
          startTime: new Date("2025-01-15T09:00:00Z"),
          duration: 30,
        },
      ],
      participantCount: 3,
    };

    it("should return a list of polls", async () => {
      mockListPolls.mockResolvedValue({
        polls: [mockListedPoll],
        nextCursor: null,
      });

      const res = await app.request("/api/private/polls", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(listPollsSuccessResponseSchema, json);

      expect(json.data).toHaveLength(1);
      expect(json.data[0].id).toBe("test-poll-id");
      expect(json.data[0].title).toBe("Team sync");
      expect(json.data[0].status).toBe("open");
      expect(json.data[0].participantCount).toBe(3);
      expect(json.data[0].createdAt).toBe("2025-01-10T12:00:00.000Z");
      expect(json.data[0].options).toEqual([
        {
          id: "opt-1",
          startTime: "2025-01-15T09:00:00.000Z",
          duration: 30,
        },
      ]);
      expect(json.data[0].adminUrl).toBe(
        "https://example.com/poll/test-poll-id",
      );
      expect(json.data[0].inviteUrl).toBe(
        "https://example.com/invite/test-poll-id",
      );
      expect(json.nextCursor).toBeNull();

      expect(mockListPolls).toHaveBeenCalledWith({
        spaceId: "test-space-id",
        status: undefined,
        cursor: undefined,
        limit: 20,
      });
    });

    it("should return an empty list when the space has no polls", async () => {
      mockListPolls.mockResolvedValue({
        polls: [],
        nextCursor: null,
      });

      const res = await app.request("/api/private/polls", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(listPollsSuccessResponseSchema, json);
      expect(json.data).toEqual([]);
      expect(json.nextCursor).toBeNull();
    });

    it("should pass the status filter to the query", async () => {
      mockListPolls.mockResolvedValue({
        polls: [],
        nextCursor: null,
      });

      const res = await app.request("/api/private/polls?status=open", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      expect(mockListPolls).toHaveBeenCalledWith(
        expect.objectContaining({
          spaceId: "test-space-id",
          status: "open",
        }),
      );
    });

    it("should return 400 for an invalid status", async () => {
      const res = await app.request("/api/private/polls?status=finalized", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(400);
      expect(mockListPolls).not.toHaveBeenCalled();
    });

    it("should pass cursor and limit to the query and return nextCursor", async () => {
      mockListPolls.mockResolvedValue({
        polls: [mockListedPoll],
        nextCursor: "test-poll-id",
      });

      const res = await app.request(
        "/api/private/polls?cursor=prev-poll-id&limit=1",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(listPollsSuccessResponseSchema, json);
      expect(json.nextCursor).toBe("test-poll-id");

      expect(mockListPolls).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: "prev-poll-id",
          limit: 1,
        }),
      );
    });

    it("should return 400 when limit exceeds the maximum", async () => {
      const res = await app.request("/api/private/polls?limit=101", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(400);
      expect(mockListPolls).not.toHaveBeenCalled();
    });

    it("should return 401 without authorization", async () => {
      const res = await app.request("/api/private/polls", {
        method: "GET",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("Get poll results", () => {
    it("should return aggregated vote results", async () => {
      mockGetPollResults.mockResolvedValue({
        pollId: "test-poll-id",
        status: "open",
        participantCount: 5,
        highScore: 4003,
        options: [
          {
            id: "opt-1",
            startTime: new Date("2025-01-15T09:00:00Z"),
            duration: 30,
            votes: [
              { type: "yes", count: 3 },
              { type: "ifNeedBe", count: 1 },
              { type: "no", count: 1 },
            ],
            score: 4003,
            isTopChoice: true,
          },
          {
            id: "opt-2",
            startTime: new Date("2025-01-15T10:00:00Z"),
            duration: 30,
            votes: [
              { type: "yes", count: 1 },
              { type: "no", count: 2 },
            ],
            score: 1001,
            isTopChoice: false,
          },
          {
            id: "opt-3",
            startTime: new Date("2025-01-15T11:00:00Z"),
            duration: 30,
            votes: [],
            score: 0,
            isTopChoice: false,
          },
        ],
      });

      const res = await app.request("/api/private/polls/test-poll-id/results", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(getPollResultsSuccessResponseSchema, json);

      expect(json.data.pollId).toBe("test-poll-id");
      expect(json.data.status).toBe("open");
      expect(json.data.participantCount).toBe(5);
      expect(json.data.highScore).toBe(4003);
      expect(json.data.options).toHaveLength(3);

      expect(mockGetPollResults).toHaveBeenCalledWith({
        pollId: "test-poll-id",
        spaceId: "test-space-id",
      });
    });

    it("should return the poll status for closed polls", async () => {
      mockGetPollResults.mockResolvedValue({
        pollId: "test-poll-id",
        status: "closed",
        participantCount: 1,
        highScore: 1001,
        options: [
          {
            id: "opt-1",
            startTime: new Date("2025-01-15T09:00:00Z"),
            duration: 30,
            votes: [{ type: "yes", count: 1 }],
            score: 1001,
            isTopChoice: true,
          },
        ],
      });

      const res = await app.request("/api/private/polls/test-poll-id/results", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(getPollResultsSuccessResponseSchema, json);
      expect(json.data.status).toBe("closed");
    });

    it("should handle ties for top choice", async () => {
      mockGetPollResults.mockResolvedValue({
        pollId: "test-poll-id",
        status: "open",
        participantCount: 2,
        highScore: 2002,
        options: [
          {
            id: "opt-1",
            startTime: new Date("2025-01-15T09:00:00Z"),
            duration: 30,
            votes: [{ type: "yes", count: 2 }],
            score: 2002,
            isTopChoice: true,
          },
          {
            id: "opt-2",
            startTime: new Date("2025-01-15T10:00:00Z"),
            duration: 30,
            votes: [{ type: "yes", count: 2 }],
            score: 2002,
            isTopChoice: true,
          },
        ],
      });

      const res = await app.request("/api/private/polls/test-poll-id/results", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();

      // Both options have score 2002, both should be top choice
      expect(json.data.options[0].isTopChoice).toBe(true);
      expect(json.data.options[1].isTopChoice).toBe(true);
      expect(json.data.highScore).toBe(2002);
    });

    it("should prioritize total availability over yes votes", async () => {
      mockGetPollResults.mockResolvedValue({
        pollId: "test-poll-id",
        status: "open",
        participantCount: 5,
        highScore: 5003,
        options: [
          {
            id: "opt-1",
            startTime: new Date("2025-01-15T09:00:00Z"),
            duration: 30,
            votes: [{ type: "yes", count: 4 }],
            score: 4004,
            isTopChoice: false,
          },
          {
            id: "opt-2",
            startTime: new Date("2025-01-15T10:00:00Z"),
            duration: 30,
            votes: [
              { type: "yes", count: 3 },
              { type: "ifNeedBe", count: 2 },
            ],
            score: 5003,
            isTopChoice: true,
          },
        ],
      });

      const res = await app.request("/api/private/polls/test-poll-id/results", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();

      // 5 available (5003) beats 4 available (4004) even though opt-1 has more yes votes
      expect(json.data.options[0].score).toBe(4004);
      expect(json.data.options[0].isTopChoice).toBe(false);
      expect(json.data.options[1].score).toBe(5003);
      expect(json.data.options[1].isTopChoice).toBe(true);
    });

    it("should use yes votes as tiebreaker when availability is equal", async () => {
      mockGetPollResults.mockResolvedValue({
        pollId: "test-poll-id",
        status: "open",
        participantCount: 4,
        highScore: 4004,
        options: [
          {
            id: "opt-1",
            startTime: new Date("2025-01-15T09:00:00Z"),
            duration: 30,
            votes: [
              { type: "yes", count: 3 },
              { type: "ifNeedBe", count: 1 },
            ],
            score: 4003,
            isTopChoice: false,
          },
          {
            id: "opt-2",
            startTime: new Date("2025-01-15T10:00:00Z"),
            duration: 30,
            votes: [{ type: "yes", count: 4 }],
            score: 4004,
            isTopChoice: true,
          },
        ],
      });

      const res = await app.request("/api/private/polls/test-poll-id/results", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();

      // Same availability (4), but opt-2 has more yes votes
      expect(json.data.options[0].score).toBe(4003);
      expect(json.data.options[0].isTopChoice).toBe(false);
      expect(json.data.options[1].score).toBe(4004);
      expect(json.data.options[1].isTopChoice).toBe(true);
    });

    it("should return 404 when poll not found", async () => {
      mockGetPollResults.mockResolvedValue(null);

      const res = await app.request(
        "/api/private/polls/nonexistent-poll/results",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("POLL_NOT_FOUND");
    });

    it("should return 401 without authorization", async () => {
      const res = await app.request("/api/private/polls/test-poll-id/results", {
        method: "GET",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("Rate limiting", () => {
    // The rate limiter is keyed per space and shares a module-level memory
    // store across the whole file. Use a dedicated space id here so the
    // requests below don't count against (or get counted by) other tests.
    const rateLimitSpaceId = "rate-limit-space-id";

    beforeEach(() => {
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([
        {
          ...mockApiKey,
          hashedKey: hashApiKey(testApiKey),
          spaceId: rateLimitSpaceId,
          lastUsedAt: new Date(),
        },
      ]);
    });

    it("should include standard RateLimit headers on successful responses", async () => {
      vi.mocked(prisma.poll.findFirst).mockResolvedValue(null);

      const res = await app.request("/api/private/polls/some-poll", {
        method: "GET",
        headers: { Authorization: `Bearer ${testApiKey}` },
      });

      expect(res.headers.get("RateLimit-Limit")).toBe(
        String(RATE_LIMIT_PER_MINUTE),
      );
      expect(res.headers.get("RateLimit-Remaining")).not.toBeNull();
    });

    it("should return 429 with RATE_LIMIT_EXCEEDED once the per-space limit is exceeded", async () => {
      vi.mocked(prisma.poll.findFirst).mockResolvedValue(null);

      const request = () =>
        app.request("/api/private/polls/some-poll", {
          method: "GET",
          headers: { Authorization: `Bearer ${testApiKey}` },
        });

      // The limit is RATE_LIMIT_PER_MINUTE requests/minute per space; one more trips it.
      let limited: Response | undefined;
      for (let i = 0; i < RATE_LIMIT_PER_MINUTE + 1; i++) {
        const res = await request();
        if (res.status === 429) {
          limited = res;
          break;
        }
      }

      expect(limited).toBeDefined();
      expect(limited?.status).toBe(429);
      expect(limited?.headers.get("Retry-After")).not.toBeNull();

      const json = await limited?.json();
      expect(json.error.code).toBe("RATE_LIMIT_EXCEEDED");
    });
  });

  describe("Get poll participants", () => {
    it("should return participants", async () => {
      mockGetPollParticipants.mockResolvedValue({
        pollId: "test-poll-id",
        participants: [
          {
            id: "participant-1",
            name: "Alice",
            email: "alice@example.com",
            createdAt: new Date("2025-01-10T10:00:00Z"),
          },
          {
            id: "participant-2",
            name: "Bob",
            email: null,
            createdAt: new Date("2025-01-10T11:00:00Z"),
          },
        ],
      });

      const res = await app.request(
        "/api/private/polls/test-poll-id/participants",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(getPollParticipantsSuccessResponseSchema, json);

      expect(json.data.pollId).toBe("test-poll-id");
      expect(json.data.participants).toHaveLength(2);

      expect(mockGetPollParticipants).toHaveBeenCalledWith({
        pollId: "test-poll-id",
        spaceId: "test-space-id",
      });
    });

    it("should return empty array when no participants", async () => {
      mockGetPollParticipants.mockResolvedValue({
        pollId: "test-poll-id",
        participants: [],
      });

      const res = await app.request(
        "/api/private/polls/test-poll-id/participants",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.pollId).toBe("test-poll-id");
      expect(json.data.participants).toEqual([]);
    });

    it("should return 404 when poll not found", async () => {
      mockGetPollParticipants.mockResolvedValue(null);

      const res = await app.request(
        "/api/private/polls/nonexistent-poll/participants",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("POLL_NOT_FOUND");
    });

    it("should return 401 without authorization", async () => {
      const res = await app.request(
        "/api/private/polls/test-poll-id/participants",
        {
          method: "GET",
        },
      );

      expect(res.status).toBe(401);
    });
  });
});
