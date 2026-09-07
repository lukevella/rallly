import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";

// Mock server-only before any imports that might need it
vi.mock("server-only", () => ({}));

const mockDeletePoll = vi.fn();
const mockCreatePoll = vi.fn();
const mockClosePoll = vi.fn();
const mockGetPollResults = vi.fn();
const mockGetPollParticipants = vi.fn();
const mockListPolls = vi.fn();
const mockGetPollWithOptions = vi.fn();
const mockGetSpaceMemberByEmail = vi.fn();
const mockTrack = vi.fn();
const mockIdentifyGroup = vi.fn();

vi.mock("@/features/poll/mutations", () => ({
  deletePoll: (...args: unknown[]) => mockDeletePoll(...args),
  createPoll: (...args: unknown[]) => mockCreatePoll(...args),
  closePoll: (...args: unknown[]) => mockClosePoll(...args),
}));

vi.mock("@/features/poll/data", () => ({
  getPollResults: (...args: unknown[]) => mockGetPollResults(...args),
  getPollParticipants: (...args: unknown[]) => mockGetPollParticipants(...args),
  listPolls: (...args: unknown[]) => mockListPolls(...args),
  getPollWithOptions: (...args: unknown[]) => mockGetPollWithOptions(...args),
}));

vi.mock("@/features/space/member/data", () => ({
  getSpaceMemberByEmail: (...args: unknown[]) =>
    mockGetSpaceMemberByEmail(...args),
}));

// Hoisted so the tests can drive the api-key middleware's lookups without
// importing @rallly/database, which the DAL lint bans outside data/mutations.
const prisma = vi.hoisted(() => ({
  spaceApiKey: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@rallly/database", () => ({ prisma }));

vi.mock("@rallly/utils/absolute-url", () => ({
  absoluteUrl: (path = "") => `https://example.com${path}`,
  shortUrl: (path: string) => `https://example.com${path}`,
}));

vi.mock("@rallly/utils/nanoid", () => ({
  nanoid: () => "test-poll-id",
}));

vi.mock("next/server", () => ({
  after: vi.fn(),
}));

vi.mock("@/lib/feature-flags/server", () => ({
  isFeatureEnabled: () => false,
}));

vi.mock("@/lib/kv", async () => ({
  redis: (await import("../../middleware/fake-redis")).createFakeRedis(),
}));

vi.mock("@/lib/posthog", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
  identifyGroup: (...args: unknown[]) => mockIdentifyGroup(...args),
  flushPostHog: vi.fn(),
}));

import { logger } from "@rallly/logger";
import { after } from "next/server";
import { hashApiKey, verifyApiKey } from "@/features/api-keys/utils";
import { MAX_SLOT_GENERATION_DAYS } from "@/lib/datetime/slot-generator";
import { redis } from "@/lib/kv";
import type { FakeRedis } from "../../middleware/fake-redis";
import { RATE_LIMIT_PER_MINUTE } from "../../middleware/rate-limit";
import {
  createPollRequestExamples,
  patchPollRequestExamples,
} from "../examples";
import {
  createPollInputSchema,
  deletePollSuccessResponseSchema,
  errorResponseSchema,
  getPollParticipantsSuccessResponseSchema,
  getPollResultsSuccessResponseSchema,
  listPollsSuccessResponseSchema,
  pollResponseSchema,
} from "../schemas";
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

// Every failure must be the documented `{ error: { code, message } }` JSON
// envelope, whichever layer produced it (bearer auth, validator, handler,
// notFound, onError).
const expectErrorEnvelope = async (
  res: Response,
  { status, code }: { status: number; code: string },
) => {
  expect(res.status).toBe(status);
  expect(res.headers.get("content-type")).toMatch(/^application\/json/);
  const json = await res.json();
  expectMatchesContract(errorResponseSchema, json);
  expect(json.error.code).toBe(code);
  expect(typeof json.error.message).toBe("string");
  return json as { error: { code: string; message: string } };
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

describe("API v1 - /polls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (redis as unknown as FakeRedis).reset();

    // Mock findMany for the timing-safe lookup
    vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([mockApiKey]);
    vi.mocked(prisma.spaceApiKey.findUnique).mockResolvedValue(mockApiKey);
    vi.mocked(prisma.spaceApiKey.update).mockResolvedValue({} as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "test-user-id",
    } as never);
    mockGetSpaceMemberByEmail.mockResolvedValue(null);

    // Mock createPoll mutation
    mockCreatePoll.mockResolvedValue({
      id: "test-poll-id",
      title: "Test Poll",
      description: null,
      location: null,
      timeZone: null,
      status: "open",
      kind: "date",
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
      const res = await app.request("/api/v1/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Poll",
          dates: ["2025-01-15"],
        }),
      });

      await expectErrorEnvelope(res, { status: 401, code: "UNAUTHORIZED" });
      expect(res.headers.get("WWW-Authenticate")).not.toBeNull();
    });

    it("should return 401 with invalid API key", async () => {
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([]);

      const res = await app.request("/api/v1/polls", {
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

      await expectErrorEnvelope(res, { status: 401, code: "UNAUTHORIZED" });
      expect(res.headers.get("WWW-Authenticate")).not.toBeNull();
    });

    it("should return 401 with revoked API key", async () => {
      // Revoked keys are filtered out by the database query
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([]);

      const res = await app.request("/api/v1/polls", {
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

      await expectErrorEnvelope(res, { status: 401, code: "UNAUTHORIZED" });
      expect(res.headers.get("WWW-Authenticate")).not.toBeNull();
    });

    it("should return 401 with expired API key", async () => {
      // Expired keys are filtered out by the database query
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([]);

      const res = await app.request("/api/v1/polls", {
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

      await expectErrorEnvelope(res, { status: 401, code: "UNAUTHORIZED" });
      expect(res.headers.get("WWW-Authenticate")).not.toBeNull();
    });
  });

  describe("Pro tier enforcement", () => {
    it("should return 403 with SPACE_NOT_PRO when the space is not pro", async () => {
      const hobbyApiKey = {
        ...mockApiKey,
        space: { ...mockApiKey.space, tier: "hobby" },
      };
      vi.mocked(prisma.spaceApiKey.findMany).mockResolvedValue([hobbyApiKey]);

      const res = await app.request("/api/v1/polls", {
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

      const res = await app.request("/api/v1/polls", {
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
      const res = await app.request("/api/v1/polls", {
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

      const res = await app.request("/api/v1/polls/test-poll-id", {
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

      const res = await app.request("/api/v1/polls/test-poll-id", {
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

      const res = await app.request("/api/v1/polls/test-poll-id", {
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

      const res = await app.request("/api/v1/polls/test-poll-id", {
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
      const res = await app.request("/api/v1/polls", {
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

      const res = await app.request("/api/v1/polls", {
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
      const res = await app.request("/api/v1/polls", {
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
      expectMatchesContract(pollResponseSchema, json);
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

    it("should track poll creation with source api and kind date", async () => {
      const res = await app.request("/api/v1/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Team offsite",
          dates: ["2025-01-15"],
        }),
      });

      expect(res.status).toBe(200);
      expect(mockTrack).toHaveBeenCalledWith(
        { id: "test-user-id", isGuest: false },
        expect.objectContaining({
          event: "poll_create",
          properties: expect.objectContaining({
            kind: "date",
            source: "api",
          }),
          groups: { poll: "test-poll-id", space: "test-space-id" },
        }),
      );
      expect(mockIdentifyGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          groupType: "poll",
          groupKey: "test-poll-id",
          properties: expect.objectContaining({ kind: "date" }),
        }),
      );
    });

    it("should save location when provided", async () => {
      const res = await app.request("/api/v1/polls", {
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

      const res = await app.request("/api/v1/polls", {
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
      const res = await app.request("/api/v1/polls", {
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
      const res = await app.request("/api/v1/polls", {
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
      expectMatchesContract(pollResponseSchema, json);
      expect(json.data.id).toBe("test-poll-id");

      expect(mockCreatePoll).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Team sync",
          timeZone: "Europe/London",
        }),
      );
    });

    it("should track poll creation with source api and kind time", async () => {
      mockCreatePoll.mockResolvedValueOnce({
        id: "test-poll-id",
        title: "Team sync",
        description: null,
        location: null,
        timeZone: "Europe/London",
        status: "open",
        kind: "time",
        createdAt: new Date("2025-01-10T12:00:00Z"),
        user: { name: "Test User", image: null },
        options: [
          {
            id: "opt-1",
            startTime: new Date("2025-01-15T09:00:00Z"),
            duration: 30,
          },
        ],
      });

      const res = await app.request("/api/v1/polls", {
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
            times: ["2025-01-15T09:00:00Z"],
          },
        }),
      });

      expect(res.status).toBe(200);
      expect(mockTrack).toHaveBeenCalledWith(
        { id: "test-user-id", isGuest: false },
        expect.objectContaining({
          event: "poll_create",
          properties: expect.objectContaining({
            kind: "time",
            source: "api",
          }),
        }),
      );
      expect(mockIdentifyGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({ kind: "time" }),
        }),
      );
    });

    it("should create poll without timezone when not provided in request", async () => {
      const res = await app.request("/api/v1/polls", {
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
      const res = await app.request("/api/v1/polls", {
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
      const res = await app.request("/api/v1/polls", {
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

    it("should reject a slot generator range longer than the supported limit", async () => {
      // A 516-day range, one Sunday slot each week (~74 slots). Deliberately
      // under MAX_POLL_OPTIONS so TOO_MANY_OPTIONS can't mask it: only the
      // range check rejects this. The old code silently truncated to ~52 slots
      // and returned them as a successful poll.
      const res = await app.request("/api/v1/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Way too long",
          slots: {
            duration: 30,
            timezone: "Europe/London",
            times: [
              {
                startDate: "2025-01-01",
                endDate: "2026-06-01",
                days: ["sun"],
                startTime: "09:00",
                endTime: "09:30",
              },
            ],
          },
        }),
      });

      // Rejected up front by validation, not silently truncated into a poll.
      // Assert the error targets endDate + names the limit so an unrelated 400
      // (e.g. TOO_MANY_OPTIONS) can't mask a regression.
      expect(res.status).toBe(400);
      expect(mockCreatePoll).not.toHaveBeenCalled();
      const json = await expectErrorEnvelope(res, {
        status: 400,
        code: "VALIDATION_ERROR",
      });
      expect(json.error.message).toContain("endDate");
      expect(json.error.message).toContain(String(MAX_SLOT_GENERATION_DAYS));
    });

    it("should reject a slot generator range where endDate precedes startDate", async () => {
      const res = await app.request("/api/v1/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Reversed range",
          slots: {
            duration: 30,
            timezone: "Europe/London",
            times: [
              {
                startDate: "2025-06-01",
                endDate: "2025-01-01",
                days: ["mon"],
                startTime: "09:00",
                endTime: "10:00",
              },
            ],
          },
        }),
      });

      expect(res.status).toBe(400);
      expect(mockCreatePoll).not.toHaveBeenCalled();
      const json = await expectErrorEnvelope(res, {
        status: 400,
        code: "VALIDATION_ERROR",
      });
      expect(json.error.message).toContain("endDate");
    });

    it("should reject a range spanning exactly MAX_SLOT_GENERATION_DAYS", async () => {
      // The generator processes days inclusively, so a span equal to the cap is
      // one day too many — the boundary must reject, not truncate.
      const start = new Date(Date.UTC(2025, 0, 1));
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + MAX_SLOT_GENERATION_DAYS);
      const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);
      const res = await app.request("/api/v1/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Boundary range",
          slots: {
            duration: 30,
            timezone: "Europe/London",
            times: [
              {
                startDate: toIsoDate(start),
                endDate: toIsoDate(end),
                days: ["sun"],
                startTime: "09:00",
                endTime: "09:30",
              },
            ],
          },
        }),
      });

      expect(res.status).toBe(400);
      expect(mockCreatePoll).not.toHaveBeenCalled();
    });
  });

  describe("Validation", () => {
    it("should return error when neither dates nor slots provided", async () => {
      const res = await app.request("/api/v1/polls", {
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
      const res = await app.request("/api/v1/polls", {
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
      const res = await app.request("/api/v1/polls", {
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
      const res = await app.request("/api/v1/polls", {
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
      const res = await app.request("/api/v1/openapi");

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.info.title).toBe("Rallly API");
      expect(json.info.version).toBe("1.0.0");
    });

    it("should state the versioning policy and point the playground at this origin", async () => {
      const res = await app.request("/api/v1/openapi");

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.info.description).toContain("## Versioning");
      expect(json.info.description).toContain("new version prefix");
      expect(json.servers).toEqual([{ url: "https://example.com" }]);
    });

    it("should include create poll request examples that match the input schema", async () => {
      const res = await app.request("/api/v1/openapi");

      expect(res.status).toBe(200);
      const json = await res.json();
      const media =
        json.paths["/api/v1/polls"].post.requestBody.content[
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
      const res = await app.request("/api/v1/openapi");

      expect(res.status).toBe(200);
      const json = await res.json();
      const operation = json.paths["/api/v1/polls/{pollId}"].patch;

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

    it("should emit schema descriptions, examples and named components", async () => {
      const res = await app.request("/api/v1/openapi");

      expect(res.status).toBe(200);
      const json = await res.json();
      const schemas = json.components.schemas;

      expect(Object.keys(schemas)).toEqual(
        expect.arrayContaining([
          "CreatePollInput",
          "SlotsInput",
          "SlotGenerator",
          "Poll",
          "PollStatus",
          "PollResponse",
          "OptionResult",
          "ErrorResponse",
        ]),
      );
      // Option shapes are unions keyed by the poll kind; both variants are
      // named components and the score description states it is opaque.
      expect(schemas.OptionResult.anyOf).toEqual([
        { $ref: "#/components/schemas/DateOptionResult" },
        { $ref: "#/components/schemas/TimeOptionResult" },
      ]);
      expect(schemas.TimeOptionResult.properties.score.description).toContain(
        "Opaque ranking value",
      );
      expect(schemas.DateOptionResult.properties.date.format).toBe("date");
      expect(schemas.Poll.properties.title.example).toBe("Team sync");
      expect(
        json.paths["/api/v1/polls"].post.requestBody.content["application/json"]
          .schema,
      ).toEqual({ $ref: "#/components/schemas/CreatePollInput" });
      expect(schemas.SlotsInput.properties.times.items.anyOf).toContainEqual({
        $ref: "#/components/schemas/SlotGenerator",
      });

      // Contextual .meta() clones keep pointing at the shared component.
      const pollStatusRef = "#/components/schemas/PollStatus";
      expect(
        schemas.GetPollResultsResponse.properties.data.properties.status,
      ).toMatchObject({
        $ref: pollStatusRef,
        description: expect.stringContaining("close automatically"),
      });
      expect(schemas.PatchPollInput.properties.status).toMatchObject({
        $ref: pollStatusRef,
        example: "closed",
      });
      expect(json.paths["/api/v1/polls"].get.parameters).toContainEqual(
        expect.objectContaining({
          name: "status",
          schema: expect.objectContaining({ $ref: pollStatusRef }),
        }),
      );

      // Every $ref must resolve, and zod's intermediate keys must not leak.
      const refs = new Set<string>();
      const leaked: string[] = [];
      JSON.stringify(json, (key, value) => {
        if (key === "$ref") refs.add(value);
        if (key === "$defs" || key === "$schema") leaked.push(key);
        if (key === "id" && typeof value === "string") leaked.push(key);
        return value;
      });
      expect(leaked).toEqual([]);
      for (const ref of refs) {
        expect(ref).toMatch(/^#\/components\/schemas\//);
        expect(schemas[ref.split("/").pop() as string]).toBeDefined();
      }
    });

    it("should not serve a docs page (the reference lives in the docs site)", async () => {
      const res = await app.request("/api/v1/docs");

      expect(res.status).toBe(404);
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
      kind: "date",
      createdAt: new Date("2025-01-10T12:00:00Z"),
      user: { name: "Test User", image: null },
      options: [],
    };

    it("should close an open poll", async () => {
      mockClosePoll.mockResolvedValue(closedPoll);

      const res = await app.request("/api/v1/polls/test-poll-id", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "closed" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(pollResponseSchema, json);
      expect(json.data.id).toBe("test-poll-id");
      expect(json.data.status).toBe("closed");

      expect(mockClosePoll).toHaveBeenCalledWith({
        pollId: "test-poll-id",
        spaceId: "test-space-id",
      });
    });

    it("should be idempotent when the poll is already closed", async () => {
      mockClosePoll.mockResolvedValue(closedPoll);

      const res = await app.request("/api/v1/polls/test-poll-id", {
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

      const res = await app.request("/api/v1/polls/nonexistent-poll", {
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
      const res = await app.request("/api/v1/polls/test-poll-id", {
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
      const res = await app.request("/api/v1/polls/test-poll-id", {
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
      const res = await app.request("/api/v1/polls/test-poll-id", {
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

      const res = await app.request("/api/v1/polls/test-poll-id", {
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

      const res = await app.request("/api/v1/polls/nonexistent-poll", {
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

      const res = await app.request("/api/v1/polls/other-space-poll", {
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
      const res = await app.request("/api/v1/polls/test-poll-id", {
        method: "DELETE",
      });

      expect(res.status).toBe(401);
    });

    it("should return 404 when poll is already deleted", async () => {
      mockDeletePoll.mockResolvedValue(null);

      const res = await app.request("/api/v1/polls/deleted-poll-id", {
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
      kind: "time",
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
      mockGetPollWithOptions.mockResolvedValue(mockPoll);

      const res = await app.request("/api/v1/polls/test-poll-id", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(pollResponseSchema, json);
      expect(json.data.id).toBe("test-poll-id");
      expect(json.data.title).toBe("Team sync");
      expect(json.data.description).toBe("Weekly team meeting");
      expect(json.data.location).toBe("Zoom");
      expect(json.data.timezone).toBe("Europe/London");
      expect(json.data.status).toBe("open");
      expect(json.data.kind).toBe("time");
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

      expect(mockGetPollWithOptions).toHaveBeenCalledWith({
        pollId: "test-poll-id",
        spaceId: "test-space-id",
      });
    });

    it("should return calendar dates instead of datetimes for date polls", async () => {
      mockGetPollWithOptions.mockResolvedValue({
        ...mockPoll,
        timeZone: null,
        kind: "date",
        options: [
          {
            id: "opt-1",
            startTime: new Date("2025-01-15T00:00:00.000Z"),
            duration: 0,
          },
          {
            id: "opt-2",
            startTime: new Date("2025-01-16T00:00:00.000Z"),
            duration: 0,
          },
        ],
      });

      const res = await app.request("/api/v1/polls/test-poll-id", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(pollResponseSchema, json);
      expect(json.data.kind).toBe("date");
      expect(json.data.options).toEqual([
        { id: "opt-1", date: "2025-01-15" },
        { id: "opt-2", date: "2025-01-16" },
      ]);
    });

    it("should return poll without user when user is null", async () => {
      mockGetPollWithOptions.mockResolvedValue({
        ...mockPoll,
        user: null,
      });

      const res = await app.request("/api/v1/polls/test-poll-id", {
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
      mockGetPollWithOptions.mockResolvedValue(null);

      const res = await app.request("/api/v1/polls/nonexistent-poll", {
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
      mockGetPollWithOptions.mockResolvedValue(null);

      const res = await app.request("/api/v1/polls/other-space-poll", {
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
      const res = await app.request("/api/v1/polls/test-poll-id", {
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
      kind: "time",
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

      const res = await app.request("/api/v1/polls", {
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
      expect(json.data[0].kind).toBe("time");
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

    it("should return calendar dates for date polls in the list", async () => {
      mockListPolls.mockResolvedValue({
        polls: [
          {
            ...mockListedPoll,
            timeZone: null,
            kind: "date",
            options: [
              {
                id: "opt-1",
                startTime: new Date("2025-01-15T00:00:00.000Z"),
                duration: 0,
              },
            ],
          },
        ],
        nextCursor: null,
      });

      const res = await app.request("/api/v1/polls", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(listPollsSuccessResponseSchema, json);
      expect(json.data[0].kind).toBe("date");
      expect(json.data[0].options).toEqual([
        { id: "opt-1", date: "2025-01-15" },
      ]);
    });

    it("should return an empty list when the space has no polls", async () => {
      mockListPolls.mockResolvedValue({
        polls: [],
        nextCursor: null,
      });

      const res = await app.request("/api/v1/polls", {
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

      const res = await app.request("/api/v1/polls?status=open", {
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
      const res = await app.request("/api/v1/polls?status=finalized", {
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
        "/api/v1/polls?cursor=prev-poll-id&limit=1",
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
      const res = await app.request("/api/v1/polls?limit=101", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(400);
      expect(mockListPolls).not.toHaveBeenCalled();
    });

    it("should return 401 without authorization", async () => {
      const res = await app.request("/api/v1/polls", {
        method: "GET",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("Get poll results", () => {
    it("should return aggregated vote results", async () => {
      mockGetPollResults.mockResolvedValue({
        pollId: "test-poll-id",
        kind: "time",
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
              { type: "ifNeedBe", count: 0 },
              { type: "no", count: 2 },
            ],
            score: 1001,
            isTopChoice: false,
          },
          {
            id: "opt-3",
            startTime: new Date("2025-01-15T11:00:00Z"),
            duration: 30,
            votes: [
              { type: "yes", count: 0 },
              { type: "ifNeedBe", count: 0 },
              { type: "no", count: 0 },
            ],
            score: 0,
            isTopChoice: false,
          },
        ],
      });

      const res = await app.request("/api/v1/polls/test-poll-id/results", {
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
      expect(json.data.kind).toBe("time");
      expect(json.data.options).toHaveLength(3);
      expect(json.data.options[0]).toEqual({
        id: "opt-1",
        startTime: "2025-01-15T09:00:00.000Z",
        duration: 30,
        votes: [
          { type: "yes", count: 3 },
          { type: "ifNeedBe", count: 1 },
          { type: "no", count: 1 },
        ],
        score: 4003,
        isTopChoice: true,
      });
      // Every vote type is present even when nobody chose it.
      expect(json.data.options[2].votes).toEqual([
        { type: "yes", count: 0 },
        { type: "ifNeedBe", count: 0 },
        { type: "no", count: 0 },
      ]);

      expect(mockGetPollResults).toHaveBeenCalledWith({
        pollId: "test-poll-id",
        spaceId: "test-space-id",
      });
    });

    it("should return calendar dates for date poll results", async () => {
      mockGetPollResults.mockResolvedValue({
        pollId: "test-poll-id",
        kind: "date",
        status: "open",
        participantCount: 2,
        highScore: 2002,
        options: [
          {
            id: "opt-1",
            startTime: new Date("2025-01-15T00:00:00.000Z"),
            duration: 0,
            votes: [
              { type: "yes", count: 2 },
              { type: "ifNeedBe", count: 0 },
              { type: "no", count: 0 },
            ],
            score: 2002,
            isTopChoice: true,
          },
        ],
      });

      const res = await app.request("/api/v1/polls/test-poll-id/results", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(getPollResultsSuccessResponseSchema, json);
      expect(json.data.kind).toBe("date");
      expect(json.data.options[0]).toEqual({
        id: "opt-1",
        date: "2025-01-15",
        votes: [
          { type: "yes", count: 2 },
          { type: "ifNeedBe", count: 0 },
          { type: "no", count: 0 },
        ],
        score: 2002,
        isTopChoice: true,
      });
    });

    it("should return the poll status for closed polls", async () => {
      mockGetPollResults.mockResolvedValue({
        pollId: "test-poll-id",
        kind: "time",
        status: "closed",
        participantCount: 1,
        highScore: 1001,
        options: [
          {
            id: "opt-1",
            startTime: new Date("2025-01-15T09:00:00Z"),
            duration: 30,
            votes: [
              { type: "yes", count: 1 },
              { type: "ifNeedBe", count: 0 },
              { type: "no", count: 0 },
            ],
            score: 1001,
            isTopChoice: true,
          },
        ],
      });

      const res = await app.request("/api/v1/polls/test-poll-id/results", {
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
        kind: "time",
        status: "open",
        participantCount: 2,
        highScore: 2002,
        options: [
          {
            id: "opt-1",
            startTime: new Date("2025-01-15T09:00:00Z"),
            duration: 30,
            votes: [
              { type: "yes", count: 2 },
              { type: "ifNeedBe", count: 0 },
              { type: "no", count: 0 },
            ],
            score: 2002,
            isTopChoice: true,
          },
          {
            id: "opt-2",
            startTime: new Date("2025-01-15T10:00:00Z"),
            duration: 30,
            votes: [
              { type: "yes", count: 2 },
              { type: "ifNeedBe", count: 0 },
              { type: "no", count: 0 },
            ],
            score: 2002,
            isTopChoice: true,
          },
        ],
      });

      const res = await app.request("/api/v1/polls/test-poll-id/results", {
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
        kind: "time",
        status: "open",
        participantCount: 5,
        highScore: 5003,
        options: [
          {
            id: "opt-1",
            startTime: new Date("2025-01-15T09:00:00Z"),
            duration: 30,
            votes: [
              { type: "yes", count: 4 },
              { type: "ifNeedBe", count: 0 },
              { type: "no", count: 0 },
            ],
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
              { type: "no", count: 0 },
            ],
            score: 5003,
            isTopChoice: true,
          },
        ],
      });

      const res = await app.request("/api/v1/polls/test-poll-id/results", {
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
        kind: "time",
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
              { type: "no", count: 0 },
            ],
            score: 4003,
            isTopChoice: false,
          },
          {
            id: "opt-2",
            startTime: new Date("2025-01-15T10:00:00Z"),
            duration: 30,
            votes: [
              { type: "yes", count: 4 },
              { type: "ifNeedBe", count: 0 },
              { type: "no", count: 0 },
            ],
            score: 4004,
            isTopChoice: true,
          },
        ],
      });

      const res = await app.request("/api/v1/polls/test-poll-id/results", {
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

      const res = await app.request("/api/v1/polls/nonexistent-poll/results", {
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
      const res = await app.request("/api/v1/polls/test-poll-id/results", {
        method: "GET",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("Rate limiting", () => {
    // The rate limiter is keyed per space. Use a dedicated space id here so
    // the requests below don't count against (or get counted by) other tests.
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
      mockGetPollWithOptions.mockResolvedValue(null);

      const res = await app.request("/api/v1/polls/some-poll", {
        method: "GET",
        headers: { Authorization: `Bearer ${testApiKey}` },
      });

      expect(res.headers.get("RateLimit-Limit")).toBe(
        String(RATE_LIMIT_PER_MINUTE),
      );
      expect(res.headers.get("RateLimit-Remaining")).not.toBeNull();
    });

    it("should return 429 with RATE_LIMIT_EXCEEDED once the per-space limit is exceeded", async () => {
      mockGetPollWithOptions.mockResolvedValue(null);

      const request = () =>
        app.request("/api/v1/polls/some-poll", {
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

  describe("List poll participants", () => {
    const participants = [
      {
        id: "participant-1",
        name: "Alice",
        email: "alice@example.com",
        createdAt: new Date("2025-01-10T10:00:00Z"),
        votes: [
          { optionId: "opt-1", type: "yes" },
          { optionId: "opt-2", type: "no" },
        ],
      },
      {
        id: "participant-2",
        name: "Bob",
        email: null,
        createdAt: new Date("2025-01-10T11:00:00Z"),
        votes: [{ optionId: "opt-1", type: "ifNeedBe" }],
      },
    ];

    it("should return participants with their votes in the list shape", async () => {
      mockGetPollParticipants.mockResolvedValue({
        pollId: "test-poll-id",
        participants,
        nextCursor: null,
      });

      const res = await app.request("/api/v1/polls/test-poll-id/participants", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(getPollParticipantsSuccessResponseSchema, json);

      expect(json.data).toHaveLength(2);
      expect(json.data[0]).toEqual({
        id: "participant-1",
        name: "Alice",
        email: "alice@example.com",
        createdAt: "2025-01-10T10:00:00.000Z",
        votes: [
          { optionId: "opt-1", type: "yes" },
          { optionId: "opt-2", type: "no" },
        ],
      });
      expect(json.data[1].email).toBeNull();
      expect(json.nextCursor).toBeNull();

      expect(mockGetPollParticipants).toHaveBeenCalledWith({
        pollId: "test-poll-id",
        spaceId: "test-space-id",
        cursor: undefined,
        limit: 50,
      });
    });

    it("should pass through a vote type the schema does not know", async () => {
      mockGetPollParticipants.mockResolvedValue({
        pollId: "test-poll-id",
        participants: [
          { ...participants[0], votes: [{ optionId: "opt-1", type: "maybe" }] },
        ],
        nextCursor: null,
      });

      const res = await app.request("/api/v1/polls/test-poll-id/participants", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expectMatchesContract(getPollParticipantsSuccessResponseSchema, json);
      expect(json.data[0].votes).toEqual([
        { optionId: "opt-1", type: "maybe" },
      ]);
    });

    it("should pass the cursor and limit through and return the next cursor", async () => {
      mockGetPollParticipants.mockResolvedValue({
        pollId: "test-poll-id",
        participants: [participants[1]],
        nextCursor: "participant-2",
      });

      const res = await app.request(
        "/api/v1/polls/test-poll-id/participants?cursor=participant-1&limit=1",
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
      expect(json.data.map((p: { id: string }) => p.id)).toEqual([
        "participant-2",
      ]);
      expect(json.nextCursor).toBe("participant-2");

      expect(mockGetPollParticipants).toHaveBeenCalledWith({
        pollId: "test-poll-id",
        spaceId: "test-space-id",
        cursor: "participant-1",
        limit: 1,
      });
    });

    it("should return 400 when limit is out of range", async () => {
      const res = await app.request(
        "/api/v1/polls/test-poll-id/participants?limit=500",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      await expectErrorEnvelope(res, { status: 400, code: "VALIDATION_ERROR" });
      expect(mockGetPollParticipants).not.toHaveBeenCalled();
    });

    it("should return empty array when no participants", async () => {
      mockGetPollParticipants.mockResolvedValue({
        pollId: "test-poll-id",
        participants: [],
        nextCursor: null,
      });

      const res = await app.request("/api/v1/polls/test-poll-id/participants", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data).toEqual([]);
      expect(json.nextCursor).toBeNull();
    });

    it("should return 404 when poll not found", async () => {
      mockGetPollParticipants.mockResolvedValue(null);

      const res = await app.request(
        "/api/v1/polls/nonexistent-poll/participants",
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
      const res = await app.request("/api/v1/polls/test-poll-id/participants", {
        method: "GET",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("Error envelope", () => {
    const authed = { Authorization: `Bearer ${testApiKey}` };

    it("should return 400 INVALID_AUTHORIZATION_HEADER as JSON for a malformed Authorization header", async () => {
      const res = await app.request("/api/v1/polls", {
        method: "GET",
        headers: { Authorization: "Basic not-a-bearer-token" },
      });

      await expectErrorEnvelope(res, {
        status: 400,
        code: "INVALID_AUTHORIZATION_HEADER",
      });
      expect(res.headers.get("WWW-Authenticate")).toContain("invalid_request");
    });

    it("should return 400 VALIDATION_ERROR naming the fields, without echoing the body, for an invalid JSON body", async () => {
      const res = await app.request("/api/v1/polls", {
        method: "POST",
        headers: { ...authed, "Content-Type": "application/json" },
        body: JSON.stringify({ dates: ["not-a-date"], secret: "do-not-echo" }),
      });

      const json = await expectErrorEnvelope(res, {
        status: 400,
        code: "VALIDATION_ERROR",
      });
      expect(json.error.message).toContain("title:");
      expect(json.error.message).toContain("dates.0:");
      expect(Object.keys(json.error).sort()).toEqual(["code", "message"]);
      expect(JSON.stringify(json)).not.toContain("do-not-echo");
      expect(json).not.toHaveProperty("success");
      expect(json).not.toHaveProperty("data");
      expect(mockCreatePoll).not.toHaveBeenCalled();
    });

    it("should return 400 VALIDATION_ERROR as JSON for an invalid query string", async () => {
      const res = await app.request("/api/v1/polls?limit=9999", {
        method: "GET",
        headers: authed,
      });

      const json = await expectErrorEnvelope(res, {
        status: 400,
        code: "VALIDATION_ERROR",
      });
      expect(json.error.message).toMatch(/^limit: /);
      expect(mockListPolls).not.toHaveBeenCalled();
    });

    it("should return 400 VALIDATION_ERROR as JSON for a PATCH body that fails validation", async () => {
      const res = await app.request("/api/v1/polls/test-poll-id", {
        method: "PATCH",
        headers: { ...authed, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });

      const json = await expectErrorEnvelope(res, {
        status: 400,
        code: "VALIDATION_ERROR",
      });
      expect(json.error.message).toMatch(/^status: /);
      expect(json).not.toHaveProperty("data");
    });

    it("should return 400 VALIDATION_ERROR as JSON for a malformed JSON body", async () => {
      const res = await app.request("/api/v1/polls", {
        method: "POST",
        headers: { ...authed, "Content-Type": "application/json" },
        body: "{not json",
      });

      await expectErrorEnvelope(res, { status: 400, code: "VALIDATION_ERROR" });
    });

    it("should return 404 NOT_FOUND as JSON for an unknown route", async () => {
      const res = await app.request("/api/v1/nope", {
        method: "GET",
        headers: authed,
      });

      await expectErrorEnvelope(res, { status: 404, code: "NOT_FOUND" });
    });

    it("should return 404 NOT_FOUND as JSON for an unsupported method on a known route", async () => {
      const res = await app.request("/api/v1/polls", {
        method: "PUT",
        headers: authed,
      });

      await expectErrorEnvelope(res, { status: 404, code: "NOT_FOUND" });
    });

    it("should return 500 INTERNAL_ERROR as JSON and log the error when a handler behind the rate limiter throws", async () => {
      const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
      onTestFinished(() => errorSpy.mockRestore());
      mockGetPollWithOptions.mockRejectedValue(new TypeError("db exploded"));

      const res = await app.request("/api/v1/polls/test-poll-id", {
        method: "GET",
        headers: authed,
      });

      const json = await expectErrorEnvelope(res, {
        status: 500,
        code: "INTERNAL_ERROR",
      });
      // Never leak the underlying error message to the client.
      expect(json.error.message).not.toContain("db exploded");
      // The request was counted by the limiter before the handler threw.
      expect(res.headers.get("RateLimit-Limit")).not.toBeNull();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toMatchObject({
        service: "api-v1",
        statusCode: 500,
        errorType: "TypeError",
        errorMessage: "db exploded",
        spaceId: "test-space-id",
      });
    });

    it("should document the full error code list in the spec", async () => {
      const res = await app.request("/api/v1/openapi");
      const json = await res.json();

      for (const code of [
        "VALIDATION_ERROR",
        "UNAUTHORIZED",
        "INVALID_AUTHORIZATION_HEADER",
        "SPACE_NOT_PRO",
        "RATE_LIMIT_EXCEEDED",
        "NOT_FOUND",
        "POLL_NOT_FOUND",
        "ORGANIZER_NOT_MEMBER",
        "TOO_MANY_OPTIONS",
        "DUPLICATE_DATES",
        "NO_OPTIONS_GENERATED",
        "TRANSITION_NOT_AVAILABLE",
        "SERVICE_UNAVAILABLE",
        "INTERNAL_ERROR",
      ]) {
        expect(json.info.description).toContain(`\`${code}\``);
      }
    });
  });
});
