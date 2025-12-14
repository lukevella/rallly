/**
 * Unit tests for pattern-analyzer
 */

import { describe, expect, it } from "vitest";
import {
  analyzePatterns,
  findBestTimeSlots,
  generatePatternMatches,
} from "./pattern-analyzer";
import type { HistoricalPollData } from "../types";

describe("pattern-analyzer", () => {
  const createMockData = (): HistoricalPollData => ({
    participantPatterns: [
      {
        participantId: "user1",
        email: "user1@example.com",
        votingHistory: [],
        availabilityPattern: {
          dayOfWeek: {
            0: 0,
            1: 0.8, // Monday preference
            2: 0.9, // Tuesday preference
            3: 0.7,
            4: 0.6,
            5: 0.5,
            6: 0,
          },
          timeOfDay: {
            morning: 0.3,
            afternoon: 0.9, // Afternoon preference
            evening: 0.4,
          },
          preferredHours: [14, 15, 16],
          avoidedHours: [8, 9],
        },
      },
    ],
    timePreferences: {
      mostCommonDay: 2, // Tuesday
      mostCommonTime: 14, // 2 PM
      averageDuration: 60,
      timezoneDistribution: {
        "America/New_York": 5,
      },
    },
    finalizedTimes: [
      {
        pollId: "poll1",
        startTime: new Date("2025-12-23T14:00:00Z"),
        endTime: new Date("2025-12-23T15:00:00Z"),
        participants: ["user1"],
        success: true,
        createdAt: new Date(),
      },
    ],
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

  describe("analyzePatterns", () => {
    it("should return structured pattern analysis", () => {
      const data = createMockData();
      const result = analyzePatterns(data);

      expect(result).toHaveProperty("patterns");
      expect(result).toHaveProperty("finalizedEvents");
      expect(result).toHaveProperty("participantCount");
      expect(result).toHaveProperty("dataQuality");
      expect(result.dataQuality).toBe("high");
    });

    it("should normalize day of week patterns", () => {
      const data = createMockData();
      const result = analyzePatterns(data);

      const dayScores = Object.values(result.patterns.dayOfWeek);
      const maxScore = Math.max(...dayScores);
      expect(maxScore).toBeLessThanOrEqual(1);
    });

    it("should determine data quality correctly", () => {
      const lowData: HistoricalPollData = {
        ...createMockData(),
        aggregateStats: {
          totalPollsAnalyzed: 2,
          totalVotesAnalyzed: 5,
          dateRange: {
            earliest: new Date(),
            latest: new Date(),
          },
          participantCount: 1,
          averageResponseRate: 0.5,
        },
      };

      const result = analyzePatterns(lowData);
      expect(result.dataQuality).toBe("low");
    });
  });

  describe("findBestTimeSlots", () => {
    it("should return time slots within date range", () => {
      const data = createMockData();
      const dateRange = {
        start: new Date("2025-12-20T00:00:00Z"),
        end: new Date("2025-12-27T23:59:59Z"),
      };
      const duration = 60;

      const result = findBestTimeSlots(data, dateRange, duration);

      expect(result.length).toBeGreaterThan(0);
      result.forEach((slot) => {
        expect(slot.startTime.getTime()).toBeGreaterThanOrEqual(dateRange.start.getTime());
        expect(slot.endTime.getTime()).toBeLessThanOrEqual(dateRange.end.getTime());
        expect(slot.score).toBeGreaterThan(0);
      });
    });

    it("should filter out low-scoring time slots", () => {
      const data = createMockData();
      const dateRange = {
        start: new Date("2025-12-20T00:00:00Z"),
        end: new Date("2025-12-27T23:59:59Z"),
      };
      const duration = 60;

      const result = findBestTimeSlots(data, dateRange, duration);

      result.forEach((slot) => {
        expect(slot.score).toBeGreaterThan(0.4);
      });
    });

    it("should include reasoning for suggestions", () => {
      const data = createMockData();
      const dateRange = {
        start: new Date("2025-12-20T00:00:00Z"),
        end: new Date("2025-12-27T23:59:59Z"),
      };
      const duration = 60;

      const result = findBestTimeSlots(data, dateRange, duration);

      if (result.length > 0) {
        expect(result[0].reasoning).toBeDefined();
        expect(Array.isArray(result[0].reasoning)).toBe(true);
      }
    });
  });

  describe("generatePatternMatches", () => {
    it("should generate pattern match descriptions", () => {
      const data = createMockData();
      const result = generatePatternMatches(data);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should identify strong day preferences", () => {
      const data = createMockData();
      const result = generatePatternMatches(data);

      // Should identify Tuesday preference (day 2 with score 0.9)
      const hasDayMatch = result.some((match) =>
        match.toLowerCase().includes("tuesday"),
      );
      expect(hasDayMatch).toBe(true);
    });
  });
});


