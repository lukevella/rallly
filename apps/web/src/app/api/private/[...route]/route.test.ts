import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only before any imports that might need it
vi.mock("server-only", () => ({}));

const mockDeletePoll = vi.fn();
const mockCreatePoll = vi.fn();
const mockGetPollResults = vi.fn();
const mockGetPollParticipants = vi.fn();

vi.mock("@/features/poll/mutations", () => ({
  deletePoll: (...args: unknown[]) => mockDeletePoll(...args),
  createPoll: (...args: unknown[]) => mockCreatePoll(...args),
}));

vi.mock("@/features/poll/data", () => ({
  getPollResults: (...args: unknown[]) => mockGetPollResults(...args),
  getPollParticipants: (...args: unknown[]) => mockGetPollParticipants(...args),
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

vi.mock("@vercel/functions", () => ({
  waitUntil: vi.fn(),
}));

vi.mock("@/lib/kv", () => ({
  isKvEnabled: () => false,
  kv: null,
}));

import { prisma } from "@rallly/database";
import { app } from "./route";

// Pre-generated test API key fixture (eliminates non-deterministic scrypt timing issues)
// Generated once using createApiKey() and saved here for consistent test behavior
const testApiKey = "sk_eXzkd84Y_bN24KFwZ_UyiQ0b6zckpNfL2pSdng3r3";
const mockApiKey = {
  id: "api-key-id",
  name: "Test API Key",
  prefix: "sk_eXzkd84Y",
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

    it("should return docs page", async () => {
      const res = await app.request("/api/private/docs");

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/html");
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

  describe("Get poll results", () => {
    it("should return aggregated vote results", async () => {
      mockGetPollResults.mockResolvedValue({
        pollId: "test-poll-id",
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

      expect(json.data.pollId).toBe("test-poll-id");
      expect(json.data.participantCount).toBe(5);
      expect(json.data.highScore).toBe(4003);
      expect(json.data.options).toHaveLength(3);

      expect(mockGetPollResults).toHaveBeenCalledWith({
        pollId: "test-poll-id",
        spaceId: "test-space-id",
      });
    });

    it("should handle ties for top choice", async () => {
      mockGetPollResults.mockResolvedValue({
        pollId: "test-poll-id",
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
