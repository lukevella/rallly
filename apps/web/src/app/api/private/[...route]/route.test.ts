import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@rallly/database", () => ({
  prisma: {
    spaceApiKey: {
      findUnique: vi.fn(),
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

import crypto from "node:crypto";
import { prisma } from "@rallly/database";
import { app } from "./route";

const createMockApiKey = (rawKey: string) => {
  const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");
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

    vi.mocked(prisma.spaceApiKey.findUnique).mockResolvedValue(mockApiKey);
    vi.mocked(prisma.spaceApiKey.update).mockResolvedValue({} as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "test-user-id",
      timeZone: "Europe/London",
    } as never);
    vi.mocked(prisma.spaceMember.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.poll.create).mockResolvedValue({
      id: "test-poll-id",
    } as never);
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
      vi.mocked(prisma.spaceApiKey.findUnique).mockResolvedValue(null);

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
      vi.mocked(prisma.spaceApiKey.findUnique).mockResolvedValue({
        ...mockApiKey,
        revokedAt: new Date(),
      });

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
      vi.mocked(prisma.spaceApiKey.findUnique).mockResolvedValue({
        ...mockApiKey,
        expiresAt: new Date("2020-01-01"),
      });

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

      expect(prisma.poll.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Team offsite",
            options: {
              createMany: {
                data: [
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
              },
            },
          }),
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
      expect(prisma.poll.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Team offsite",
            location: "Conference Room A",
          }),
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

      expect(prisma.poll.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Team sync",
            timeZone: "Europe/London",
          }),
        }),
      );
    });

    it("should use user timezone when not provided in request", async () => {
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
      expect(prisma.poll.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timeZone: "Europe/London",
          }),
        }),
      );
    });

    it("should return error when timezone is missing and user has no timezone", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        timeZone: null,
      } as never);

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

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("TIMEZONE_REQUIRED");
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
      expect(prisma.poll.create).toHaveBeenCalled();
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
});
