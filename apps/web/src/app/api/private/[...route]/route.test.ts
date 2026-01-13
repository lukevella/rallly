import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDeletePoll = vi.fn();
const mockCreatePoll = vi.fn();

vi.mock("@/features/poll/mutations", () => ({
  deletePoll: (...args: unknown[]) => mockDeletePoll(...args),
  createPoll: (...args: unknown[]) => mockCreatePoll(...args),
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
import { hashApiKey, randomToken } from "@/features/developer/utils";
import { app } from "./route";

const createMockApiKey = (rawKey: string) => {
  // Use the new salted hash format
  const salt = randomToken(12);
  const hash = hashApiKey(rawKey, salt);
  const hashedKey = `sha256$${salt}$${hash}`;

  return {
    id: "api-key-id",
    name: "Test API Key",
    prefix: "abc123",
    spaceId: "test-space-id",
    hashedKey,
    lastUsedAt: null,
    expiresAt: null,
    revokedAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    space: {
      ownerId: "test-user-id",
    },
  };
};

describe("Private API - /polls", () => {
  const testApiKey = "sk_abc123_secretkey";
  const mockApiKey = createMockApiKey(testApiKey);

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
      status: "live",
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
            times: {
              startDate: "2025-01-20",
              endDate: "2025-01-22",
              days: ["mon", "tue", "wed"],
              startTime: "09:00",
              endTime: "10:00",
            },
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
      status: "live",
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
      expect(json.data.timeZone).toBe("Europe/London");
      expect(json.data.status).toBe("live");
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
});
