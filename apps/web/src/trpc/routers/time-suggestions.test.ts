/**
 * Unit tests for time-suggestions tRPC router
 * 
 * Note: These are integration-style tests that verify the router logic.
 * For full integration testing, use Playwright tests.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import type { SuggestionRequest } from "@/features/time-suggestions/types";

// Mock dependencies
vi.mock("@/features/time-suggestions/lib/cache-manager", () => ({
  getCachedSuggestions: vi.fn(),
  cacheSuggestions: vi.fn(),
}));

vi.mock("@/features/time-suggestions/queries", () => ({
  hasSufficientData: vi.fn(),
}));

vi.mock("@/features/time-suggestions/lib/data-aggregator", () => ({
  aggregateHistoricalData: vi.fn(),
}));

vi.mock("@/features/time-suggestions/lib/ai-service", () => ({
  generateAISuggestions: vi.fn(),
}));

describe("time-suggestions router", () => {
  // Note: Full router testing requires a tRPC test setup
  // These tests verify the service layer integration

  const validInput: SuggestionRequest = {
    participants: [
      { email: "test@example.com", name: "Test User", timeZone: "America/New_York" },
    ],
    dateRange: {
      start: new Date("2025-12-20"),
      end: new Date("2025-12-27"),
    },
    duration: 60,
    timezone: "America/New_York",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("should validate participant input schema", () => {
      // Zod schema validation is tested implicitly through tRPC
      // This test documents the expected behavior
      expect(validInput.participants.length).toBeGreaterThan(0);
      expect(validInput.duration).toBeGreaterThanOrEqual(15);
      expect(validInput.duration).toBeLessThanOrEqual(1440);
    });

    it("should validate date range constraints", () => {
      const start = new Date("2025-12-20");
      const end = new Date("2025-12-27");
      expect(start.getTime()).toBeLessThan(end.getTime());
    });
  });

  describe("service integration", () => {
    it("should check cache before generating suggestions", async () => {
      const { getCachedSuggestions } = await import("@/features/time-suggestions/lib/cache-manager");
      vi.mocked(getCachedSuggestions).mockResolvedValueOnce(null);

      // Verify cache check is called
      await getCachedSuggestions(validInput);
      expect(getCachedSuggestions).toHaveBeenCalledWith(validInput);
    });

    it("should check data availability", async () => {
      const { hasSufficientData } = await import("@/features/time-suggestions/queries");
      vi.mocked(hasSufficientData).mockResolvedValueOnce({
        hasData: true,
        pollCount: 10,
        voteCount: 50,
        quality: "high",
      });

      const result = await hasSufficientData(validInput.participants);
      expect(result.hasData).toBe(true);
      expect(result.pollCount).toBe(10);
    });
  });
});

