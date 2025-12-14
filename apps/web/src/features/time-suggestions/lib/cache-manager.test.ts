/**
 * Unit tests for cache-manager
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  cacheSuggestions,
  getCachedSuggestions,
  isCachingEnabled,
} from "./cache-manager";
import type { SuggestionRequest, TimeSuggestion } from "../types";

// Mock KV
vi.mock("@/lib/kv", () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
  isKvEnabled: true,
}));

describe("cache-manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isCachingEnabled", () => {
    it("should return true when KV is enabled", () => {
      expect(isCachingEnabled()).toBe(true);
    });
  });

  describe("getCachedSuggestions", () => {
    it("should return null when cache is empty", async () => {
      const { kv } = await import("@/lib/kv");
      vi.mocked(kv.get).mockResolvedValueOnce(null);

      const request: SuggestionRequest = {
        participants: [{ email: "test@example.com", name: "Test" }],
        dateRange: {
          start: new Date("2025-12-20"),
          end: new Date("2025-12-27"),
        },
        duration: 60,
        timezone: "America/New_York",
      };

      const result = await getCachedSuggestions(request);
      expect(result).toBeNull();
    });

    it("should return cached suggestions when available", async () => {
      const { kv } = await import("@/lib/kv");
      const cachedData = {
        key: "test-key",
        suggestions: [
          {
            id: "sugg-1",
            startTime: new Date("2025-12-23T14:00:00Z").toISOString(),
            endTime: new Date("2025-12-23T15:00:00Z").toISOString(),
            confidence: 85,
            reasoning: "Test reasoning",
            sourceData: {
              similarPolls: 5,
              participantMatches: 2,
              patternMatches: ["Tuesday preference"],
            },
            timezoneInfo: {
              pollTimezone: "America/New_York",
              participantTimezones: {},
            },
          },
        ],
        metadata: {
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          participantHash: "test-hash",
          dataQuality: "high" as const,
          requestParams: {
            participants: [{ email: "test@example.com", name: "Test" }],
            dateRange: {
              start: new Date("2025-12-20").toISOString(),
              end: new Date("2025-12-27").toISOString(),
            },
            duration: 60,
            timezone: "America/New_York",
          },
        },
      };

      vi.mocked(kv.get).mockResolvedValueOnce(JSON.stringify(cachedData));

      const request: SuggestionRequest = {
        participants: [{ email: "test@example.com", name: "Test" }],
        dateRange: {
          start: new Date("2025-12-20"),
          end: new Date("2025-12-27"),
        },
        duration: 60,
        timezone: "America/New_York",
      };

      const result = await getCachedSuggestions(request);

      expect(result).not.toBeNull();
      expect(result?.suggestions).toHaveLength(1);
      expect(result?.suggestions[0].startTime).toBeInstanceOf(Date);
      expect(result?.suggestions[0].endTime).toBeInstanceOf(Date);
    });

    it("should return null when cache is expired", async () => {
      const { kv } = await import("@/lib/kv");
      const expiredData = {
        key: "test-key",
        suggestions: [],
        metadata: {
          generatedAt: new Date(Date.now() - 600000).toISOString(),
          expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
          participantHash: "test-hash",
          dataQuality: "high" as const,
          requestParams: {
            participants: [{ email: "test@example.com", name: "Test" }],
            dateRange: {
              start: new Date("2025-12-20").toISOString(),
              end: new Date("2025-12-27").toISOString(),
            },
            duration: 60,
            timezone: "America/New_York",
          },
        },
      };

      vi.mocked(kv.get).mockResolvedValueOnce(JSON.stringify(expiredData));

      const request: SuggestionRequest = {
        participants: [{ email: "test@example.com", name: "Test" }],
        dateRange: {
          start: new Date("2025-12-20"),
          end: new Date("2025-12-27"),
        },
        duration: 60,
        timezone: "America/New_York",
      };

      const result = await getCachedSuggestions(request);
      expect(result).toBeNull();
      expect(kv.del).toHaveBeenCalled();
    });
  });

  describe("cacheSuggestions", () => {
    it("should cache suggestions with TTL", async () => {
      const { kv } = await import("@/lib/kv");
      const request: SuggestionRequest = {
        participants: [{ email: "test@example.com", name: "Test" }],
        dateRange: {
          start: new Date("2025-12-20"),
          end: new Date("2025-12-27"),
        },
        duration: 60,
        timezone: "America/New_York",
      };

      const suggestions: TimeSuggestion[] = [
        {
          id: "sugg-1",
          startTime: new Date("2025-12-23T14:00:00Z"),
          endTime: new Date("2025-12-23T15:00:00Z"),
          confidence: 85,
          reasoning: "Test reasoning",
          sourceData: {
            similarPolls: 5,
            participantMatches: 2,
            patternMatches: ["Tuesday preference"],
          },
          timezoneInfo: {
            pollTimezone: "America/New_York",
            participantTimezones: {},
          },
        },
      ];

      await cacheSuggestions(request, suggestions, "high");

      expect(kv.set).toHaveBeenCalledWith(
        expect.stringContaining("ai-suggestions:"),
        expect.any(String),
        expect.objectContaining({ ex: 300 }),
      );
    });

    it("should handle errors gracefully", async () => {
      const { kv } = await import("@/lib/kv");
      vi.mocked(kv.set).mockRejectedValueOnce(new Error("Cache error"));

      const request: SuggestionRequest = {
        participants: [{ email: "test@example.com", name: "Test" }],
        dateRange: {
          start: new Date("2025-12-20"),
          end: new Date("2025-12-27"),
        },
        duration: 60,
        timezone: "America/New_York",
      };

      const suggestions: TimeSuggestion[] = [];

      // Should not throw
      await expect(
        cacheSuggestions(request, suggestions, "low"),
      ).resolves.not.toThrow();
    });
  });
});


