/**
 * Unit tests for data-aggregator
 */

import { describe, expect, it, vi } from "vitest";
import { aggregateHistoricalData, getHistoricalPolls } from "./data-aggregator";
import type { ParticipantInput } from "../types";

// Mock Prisma
vi.mock("@rallly/database", () => ({
  prisma: {
    poll: {
      findMany: vi.fn(),
    },
    scheduledEvent: {
      findMany: vi.fn(),
    },
  },
}));

describe("data-aggregator", () => {
  describe("getHistoricalPolls", () => {
    it("should return empty array when no participant identifiers provided", async () => {
      const participants: ParticipantInput[] = [{ name: "Test User" }];
      const result = await getHistoricalPolls(participants);
      expect(result).toEqual([]);
    });

    it("should query polls with participant emails", async () => {
      const { prisma } = await import("@rallly/database");
      vi.mocked(prisma.poll.findMany).mockResolvedValueOnce([]);

      const participants: ParticipantInput[] = [
        { email: "test@example.com", name: "Test User" },
      ];
      await getHistoricalPolls(participants);

      expect(prisma.poll.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            participants: expect.objectContaining({
              some: expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ email: { in: ["test@example.com"] } }),
                ]),
              }),
            }),
          }),
        }),
      );
    });
  });

  describe("aggregateHistoricalData", () => {
    it("should return structured data with all required fields", async () => {
      const { prisma } = await import("@rallly/database");
      vi.mocked(prisma.poll.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.scheduledEvent.findMany).mockResolvedValueOnce([]);

      const participants: ParticipantInput[] = [
        { email: "test@example.com", name: "Test User" },
      ];
      const result = await aggregateHistoricalData(participants);

      expect(result).toHaveProperty("participantPatterns");
      expect(result).toHaveProperty("timePreferences");
      expect(result).toHaveProperty("finalizedTimes");
      expect(result).toHaveProperty("aggregateStats");
      expect(Array.isArray(result.participantPatterns)).toBe(true);
      expect(Array.isArray(result.finalizedTimes)).toBe(true);
    });

    it("should handle empty data gracefully", async () => {
      const { prisma } = await import("@rallly/database");
      vi.mocked(prisma.poll.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.scheduledEvent.findMany).mockResolvedValueOnce([]);

      const participants: ParticipantInput[] = [
        { email: "new@example.com", name: "New User" },
      ];
      const result = await aggregateHistoricalData(participants);

      expect(result.participantPatterns).toHaveLength(1);
      expect(result.participantPatterns[0].votingHistory).toHaveLength(0);
      expect(result.finalizedTimes).toHaveLength(0);
      expect(result.aggregateStats.totalPollsAnalyzed).toBe(0);
    });
  });
});


