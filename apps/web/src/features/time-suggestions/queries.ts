/**
 * Data fetching utilities for time suggestions
 * Re-exports and provides convenience functions
 */

import "server-only";

import { aggregateHistoricalData } from "./lib/data-aggregator";
import type { HistoricalPollData, ParticipantInput } from "./types";

/**
 * Get historical data for participants
 * Main entry point for fetching aggregated poll data
 */
export async function getHistoricalDataForParticipants(
  participants: ParticipantInput[],
): Promise<HistoricalPollData> {
  return aggregateHistoricalData(participants);
}

/**
 * Check if sufficient data exists for suggestions
 */
export async function hasSufficientData(
  participants: ParticipantInput[],
  userId?: string,
  spaceId?: string,
): Promise<{
  hasData: boolean;
  pollCount: number;
  voteCount: number;
  quality: "high" | "medium" | "low";
}> {
  console.log("[hasSufficientData] Called with:", {
    participantsCount: participants.length,
    userId: userId || "none",
    spaceId: spaceId || "none",
  });
  
  const data = await aggregateHistoricalData(participants, userId, spaceId);

  const pollCount = data.aggregateStats.totalPollsAnalyzed;
  const voteCount = data.aggregateStats.totalVotesAnalyzed;

  let quality: "high" | "medium" | "low" = "low";
  if (pollCount >= 20 && voteCount >= 50) {
    quality = "high";
  } else if (pollCount >= 5 && voteCount >= 10) {
    quality = "medium";
  }

  const result = {
    hasData: pollCount >= 3, // Minimum threshold
    pollCount,
    voteCount,
    quality,
  };
  
  console.log("[hasSufficientData] Returning result:", result);
  
  return result;
}

