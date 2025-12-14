/**
 * Unit tests for AI service
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  generateAISuggestions,
  hasSufficientDataForAI,
  isAIAvailable,
} from "./ai-service";
import type { HistoricalPollData, SuggestionRequest } from "../types";

// Mock dependencies
vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn((model: string) => model),
}));

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

vi.mock("@/env", () => ({
  env: {
    OPENAI_API_KEY: "test-key",
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("./pattern-analyzer", () => ({
  findBestTimeSlots: vi.fn().mockReturnValue([
    {
      startTime: new Date("2025-12-23T14:00:00Z"),
      endTime: new Date("2025-12-23T15:00:00Z"),
      score: 0.85,
      reasoning: ["Tuesday preference", "Afternoon availability"],
    },
  ]),
}));

vi.mock("./prompt-builder", () => ({
  buildSuggestionPrompt: vi.fn().mockReturnValue("Test prompt"),
}));

vi.mock("./response-parser", () => ({
  parseAIResponse: vi.fn().mockReturnValue([
    {
      id: "sugg-1",
      startTime: new Date("2025-12-23T14:00:00Z"),
      endTime: new Date("2025-12-23T15:00:00Z"),
      confidence: 85,
      reasoning: "Test reasoning",
      sourceData: {
        similarPolls: 10,
        participantMatches: 2,
        patternMatches: ["Tuesday preference"],
      },
      timezoneInfo: {
        pollTimezone: "America/New_York",
        participantTimezones: {},
      },
    },
  ]),
  validateAIResponse: vi.fn().mockReturnValue({ valid: true }),
}));

describe("ai-service", () => {
  const createMockRequest = (): SuggestionRequest => ({
    participants: [
      { email: "test@example.com", name: "Test User", timeZone: "America/New_York" },
    ],
    dateRange: {
      start: new Date("2025-12-20"),
      end: new Date("2025-12-27"),
    },
    duration: 60,
    timezone: "America/New_York",
  });

  const createMockHistoricalData = (): HistoricalPollData => ({
    participantPatterns: [],
    timePreferences: {
      mostCommonDay: 2,
      mostCommonTime: 14,
      averageDuration: 60,
      timezoneDistribution: {},
    },
    finalizedTimes: [],
    aggregateStats: {
      totalPollsAnalyzed: 10,
      totalVotesAnalyzed: 50,
      dateRange: {
        earliest: new Date("2025-06-01"),
        latest: new Date("2025-12-01"),
      },
      participantCount: 1,
      averageResponseRate: 0.8,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isAIAvailable", () => {
    it("should return true when API key is configured", () => {
      expect(isAIAvailable()).toBe(true);
    });
  });

  describe("hasSufficientDataForAI", () => {
    it("should return true when sufficient data exists", () => {
      const data = createMockHistoricalData();
      expect(hasSufficientDataForAI(data)).toBe(true);
    });

    it("should return false when insufficient data exists", () => {
      const data = createMockHistoricalData();
      data.aggregateStats.totalPollsAnalyzed = 2;
      data.aggregateStats.totalVotesAnalyzed = 3;
      expect(hasSufficientDataForAI(data)).toBe(false);
    });
  });

  describe("generateAISuggestions", () => {
    it("should check rate limit before generating", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      const request = createMockRequest();
      const data = createMockHistoricalData();

      await generateAISuggestions(request, data);

      expect(rateLimit).toHaveBeenCalledWith(
        "ai-time-suggestions",
        10,
        "1 m",
      );
    });

    it("should use fallback when rate limit exceeded", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      vi.mocked(rateLimit).mockResolvedValueOnce({ success: false });

      const request = createMockRequest();
      const data = createMockHistoricalData();

      const result = await generateAISuggestions(request, data);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toContain("fallback");
    });

    it("should use fallback when API key is missing", async () => {
      const { env } = await import("@/env");
      vi.mocked(env).OPENAI_API_KEY = undefined;

      const request = createMockRequest();
      const data = createMockHistoricalData();

      const result = await generateAISuggestions(request, data);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toContain("fallback");
    });

    it("should use fallback when data is insufficient", async () => {
      const request = createMockRequest();
      const data = createMockHistoricalData();
      data.aggregateStats.totalPollsAnalyzed = 2;
      data.aggregateStats.totalVotesAnalyzed = 3;

      const result = await generateAISuggestions(request, data);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toContain("fallback");
    });

    it("should generate AI suggestions when conditions are met", async () => {
      const { generateText } = await import("ai");
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify([
          {
            startTime: "2025-12-23T14:00:00Z",
            endTime: "2025-12-23T15:00:00Z",
            confidence: 85,
            reasoning: "Test reasoning",
          },
        ]),
      } as any);

      const request = createMockRequest();
      const data = createMockHistoricalData();

      const result = await generateAISuggestions(request, data);

      expect(generateText).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should retry on failure", async () => {
      const { generateText } = await import("ai");
      vi.mocked(generateText)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          text: JSON.stringify([
            {
              startTime: "2025-12-23T14:00:00Z",
              endTime: "2025-12-23T15:00:00Z",
              confidence: 85,
              reasoning: "Test reasoning",
            },
          ]),
        } as any);

      const request = createMockRequest();
      const data = createMockHistoricalData();

      const result = await generateAISuggestions(request, data);

      expect(generateText).toHaveBeenCalledTimes(2);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should use fallback after max retries", async () => {
      const { generateText } = await import("ai");
      vi.mocked(generateText).mockRejectedValue(new Error("Persistent error"));

      const request = createMockRequest();
      const data = createMockHistoricalData();

      const result = await generateAISuggestions(request, data);

      expect(generateText).toHaveBeenCalledTimes(3); // MAX_RETRIES
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toContain("fallback");
    });
  });
});


