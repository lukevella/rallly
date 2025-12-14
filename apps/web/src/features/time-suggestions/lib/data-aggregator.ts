/**
 * Data Aggregator - Queries and aggregates historical poll data
 * for AI time suggestion analysis
 */

import "server-only";

import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import type {
  AggregateStats,
  FinalizedTime,
  HistoricalPollData,
  ParticipantInput,
  ParticipantPattern,
  TimePreferences,
  VotingHistory,
} from "../types";

const SIX_MONTHS_AGO = dayjs().subtract(6, "months").toDate();
const MAX_POLLS_TO_ANALYZE = 100;

/**
 * Get participant identifiers (emails and user IDs) from input
 */
function getParticipantIdentifiers(participants: ParticipantInput[]) {
  const emails = participants
    .map((p) => p.email)
    .filter((email): email is string => !!email);
  const userIds = participants
    .map((p) => p.userId)
    .filter((userId): userId is string => !!userId);

  return { emails, userIds };
}

/**
 * Query historical polls for participants
 */
export async function getHistoricalPolls(
  participants: ParticipantInput[],
  userId?: string,
  spaceId?: string,
) {
  const { emails, userIds } = getParticipantIdentifiers(participants);

  // If no participants provided but we have a userId, use that
  const effectiveUserIds = userIds.length > 0 ? userIds : (userId ? [userId] : []);

  // If we have neither emails, userIds from participants, nor a userId parameter, return empty
  if (emails.length === 0 && effectiveUserIds.length === 0 && !userId) {
    console.log("[Data Aggregator] No identifiers found, returning empty polls");
    return [];
  }

  // Build the where clause
  const whereConditions: Prisma.PollWhereInput[] = [];
  
  // ALWAYS include polls created by the user if userId is provided
  // This ensures we find polls even if the user didn't add themselves as a participant
  if (userId) {
    whereConditions.push({ userId });
    console.log("[Data Aggregator] Added condition: polls created by userId", userId);
  }
  
  // Include polls where the user is a participant (in addition to polls they created)
  if (emails.length > 0 || effectiveUserIds.length > 0) {
    const participantCondition: Prisma.PollWhereInput = {
      participants: {
        some: {
          OR: [
            ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
            ...(effectiveUserIds.length > 0 ? [{ userId: { in: effectiveUserIds } }] : []),
          ],
        },
      },
    };
    whereConditions.push(participantCondition);
    console.log("[Data Aggregator] Added condition: polls where user is a participant", {
      emails,
      userIds: effectiveUserIds,
    });
  }

  // If no conditions, return empty (shouldn't happen due to check above, but safety check)
  if (whereConditions.length === 0) {
    console.warn("[Data Aggregator] No where conditions, returning empty polls");
    return [];
  }

  // Build the where clause safely
  // Note: If spaceId is provided, we filter by it. If not, we still query by userId
  const where: Prisma.PollWhereInput = {
    ...(spaceId ? { spaceId } : {}), // Filter by space if provided
    OR: whereConditions, // We know whereConditions.length > 0 from check above
    status: { in: ["finalized", "live"] },
    deleted: false,
    createdAt: { gte: SIX_MONTHS_AGO },
  };

  try {
    console.log("[Data Aggregator] Querying polls with parameters:", {
      userId: userId || "none",
      spaceId: spaceId || "none (will query all user polls)",
      emailsCount: emails.length,
      userIdsCount: userIds.length,
      whereConditionsCount: whereConditions.length,
      sixMonthsAgo: SIX_MONTHS_AGO.toISOString(),
      whereClause: JSON.stringify(where, null, 2),
    });
    
    const polls = await prisma.poll.findMany({
      where,
      include: {
        options: {
          orderBy: {
            startTime: "asc",
          },
        },
        participants: {
          // Only filter participants if we have specific ones to look for
          // Otherwise, include all participants (needed for pattern analysis)
          ...(emails.length > 0 || userIds.length > 0 ? {
            where: {
              OR: [
                ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
                ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
              ],
            },
          } : {}),
          include: {
            votes: {
              include: {
                option: true,
              },
            },
          },
        },
        scheduledEvent: true, // For finalized polls
      },
      orderBy: {
        createdAt: "desc",
      },
      take: MAX_POLLS_TO_ANALYZE,
    });

    console.log(`[Data Aggregator] Query succeeded! Found ${polls.length} polls`);
    if (polls.length > 0) {
      console.log(`[Data Aggregator] First poll:`, {
        id: polls[0].id,
        title: polls[0].title,
        userId: polls[0].userId,
        spaceId: polls[0].spaceId,
        status: polls[0].status,
        participantsCount: polls[0].participants?.length || 0,
        optionsCount: polls[0].options?.length || 0,
      });
    }
    return polls;
  } catch (error) {
    console.error("[Data Aggregator] Error querying polls:", error);
    console.error("[Data Aggregator] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.error("[Data Aggregator] Where clause was:", JSON.stringify(where, null, 2));
    throw error; // Re-throw to be caught by aggregateHistoricalData
  }
}

/**
 * Query finalized events for participants
 */
export async function getFinalizedEvents(
  participants: ParticipantInput[],
  userId?: string,
  spaceId?: string,
) {
  const { emails, userIds } = getParticipantIdentifiers(participants);

  // If no participants provided but we have a userId, use that
  const effectiveUserIds = userIds.length > 0 ? userIds : (userId ? [userId] : []);

  // If we have neither emails, userIds from participants, nor a userId parameter, return empty
  if (emails.length === 0 && effectiveUserIds.length === 0 && !userId) {
    return [];
  }

  // Build the where clause for poll filtering
  const pollWhereConditions: Prisma.PollWhereInput[] = [];
  
  // Include polls created by the user
  if (userId) {
    pollWhereConditions.push({ userId });
  }
  
  // Include polls where the user is a participant
  if (emails.length > 0 || effectiveUserIds.length > 0) {
    pollWhereConditions.push({
      participants: {
        some: {
          OR: [
            ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
            ...(effectiveUserIds.length > 0 ? [{ userId: { in: effectiveUserIds } }] : []),
          ],
        },
      },
    });
  }

  const events = await prisma.scheduledEvent.findMany({
    where: {
      status: "confirmed",
      polls: {
        some: {
          ...(spaceId ? { spaceId } : {}), // Filter by space if provided
          ...(pollWhereConditions.length > 0 ? { OR: pollWhereConditions } : {}),
        },
      },
      start: { gte: SIX_MONTHS_AGO },
    },
    include: {
      polls: {
        take: 1, // Take the first poll (usually there's only one)
        include: {
          participants: {
            // Only filter participants if we have specific ones to look for
            ...(emails.length > 0 || userIds.length > 0 ? {
              where: {
                OR: [
                  ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
                  ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
                ],
              },
            } : {}),
            select: {
              id: true,
              email: true,
              userId: true,
            },
          },
        },
      },
    },
    orderBy: {
      start: "desc",
    },
  });

  return events;
}

/**
 * Aggregate historical poll data for AI analysis
 */
export async function aggregateHistoricalData(
  participants: ParticipantInput[],
  userId?: string,
  spaceId?: string,
): Promise<HistoricalPollData> {
  try {
    console.log("[Data Aggregator] aggregateHistoricalData called with:", {
      participantsCount: participants.length,
      userId: userId || "none",
      spaceId: spaceId || "none",
    });
    
    const [polls, events] = await Promise.all([
      getHistoricalPolls(participants, userId, spaceId),
      getFinalizedEvents(participants, userId, spaceId),
    ]);

    console.log("[Data Aggregator] Retrieved data:", {
      pollsCount: polls.length,
      eventsCount: events.length,
    });

    // Extract participant patterns
    const participantPatterns = extractParticipantPatterns(polls, participants);

    // Calculate time preferences
    const timePreferences = calculateTimePreferences(polls, events);

    // Extract finalized times
    const finalizedTimes = extractFinalizedTimes(events);

    // Calculate aggregate stats
    const aggregateStats = calculateAggregateStats(polls, events);

    console.log("[Data Aggregator] Aggregate stats calculated:", {
      totalPollsAnalyzed: aggregateStats.totalPollsAnalyzed,
      totalVotesAnalyzed: aggregateStats.totalVotesAnalyzed,
      participantCount: aggregateStats.participantCount,
      averageResponseRate: aggregateStats.averageResponseRate,
      dateRange: {
        earliest: aggregateStats.dateRange.earliest.toISOString(),
        latest: aggregateStats.dateRange.latest.toISOString(),
      },
    });
    
    // Final summary
    console.log("[Data Aggregator] ✅ Final result:", {
      hasData: aggregateStats.totalPollsAnalyzed >= 3,
      pollCount: aggregateStats.totalPollsAnalyzed,
      voteCount: aggregateStats.totalVotesAnalyzed,
      quality: aggregateStats.totalPollsAnalyzed >= 20 && aggregateStats.totalVotesAnalyzed >= 50 ? "high" :
               aggregateStats.totalPollsAnalyzed >= 5 && aggregateStats.totalVotesAnalyzed >= 10 ? "medium" : "low",
    });

    return {
      participantPatterns,
      timePreferences,
      finalizedTimes,
      aggregateStats,
    };
  } catch (error) {
    console.error("[Data Aggregator] Error aggregating historical data:", error);
    console.error("[Data Aggregator] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return empty data structure on error
    return {
      participantPatterns: [],
      timePreferences: {
        mostCommonDay: 1,
        mostCommonTime: 14,
        averageDuration: 60,
        timezoneDistribution: {},
      },
      finalizedTimes: [],
      aggregateStats: {
        totalPollsAnalyzed: 0,
        totalVotesAnalyzed: 0,
        dateRange: {
          earliest: new Date(),
          latest: new Date(),
        },
        participantCount: 0,
        averageResponseRate: 0,
      },
    };
  }
}

/**
 * Extract participant patterns from historical polls
 */
function extractParticipantPatterns(
  polls: Awaited<ReturnType<typeof getHistoricalPolls>>,
  participants: ParticipantInput[],
): ParticipantPattern[] {
  const patternMap = new Map<string, ParticipantPattern>();

  // Initialize patterns for all participants
  for (const participant of participants) {
    const key = participant.email || participant.userId || participant.name;
    if (!key) continue;

    patternMap.set(key, {
      participantId: key,
      email: participant.email,
      timeZone: participant.timeZone,
      votingHistory: [],
      availabilityPattern: {
        dayOfWeek: {
          0: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0,
        },
        timeOfDay: {
          morning: 0,
          afternoon: 0,
          evening: 0,
        },
        preferredHours: [],
        avoidedHours: [],
      },
    });
  }

  // Process votes from polls
  for (const poll of polls) {
    for (const participant of poll.participants) {
      const key =
        participant.email ||
        participant.userId ||
        participant.id;
      const pattern = patternMap.get(key);

      if (!pattern) continue;

      // Add voting history
      for (const vote of participant.votes) {
        const votingHistory: VotingHistory = {
          pollId: poll.id,
          pollTitle: poll.title,
          optionStartTime: vote.option.startTime,
          voteType: vote.type,
          createdAt: vote.createdAt || poll.createdAt,
        };

        pattern.votingHistory.push(votingHistory);

        // Update availability pattern
        const date = dayjs(vote.option.startTime);
        const dayOfWeek = date.day() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        const hour = date.hour();

        if (vote.type === "yes") {
          pattern.availabilityPattern.dayOfWeek[dayOfWeek] += 1;
          
          // Categorize time of day
          if (hour >= 6 && hour < 12) {
            pattern.availabilityPattern.timeOfDay.morning += 1;
          } else if (hour >= 12 && hour < 18) {
            pattern.availabilityPattern.timeOfDay.afternoon += 1;
          } else if (hour >= 18 && hour < 22) {
            pattern.availabilityPattern.timeOfDay.evening += 1;
          }

          // Track preferred hours
          if (!pattern.availabilityPattern.preferredHours.includes(hour)) {
            pattern.availabilityPattern.preferredHours.push(hour);
          }
        } else if (vote.type === "no") {
          // Track avoided hours
          if (!pattern.availabilityPattern.avoidedHours.includes(hour)) {
            pattern.availabilityPattern.avoidedHours.push(hour);
          }
        }
      }
    }
  }

  // Normalize availability scores (0-1 scale)
  for (const pattern of patternMap.values()) {
    const maxDayScore = Math.max(...Object.values(pattern.availabilityPattern.dayOfWeek));
    if (maxDayScore > 0) {
      for (const day in pattern.availabilityPattern.dayOfWeek) {
        pattern.availabilityPattern.dayOfWeek[day as 0 | 1 | 2 | 3 | 4 | 5 | 6] /= maxDayScore;
      }
    }

    const maxTimeScore = Math.max(...Object.values(pattern.availabilityPattern.timeOfDay));
    if (maxTimeScore > 0) {
      for (const time in pattern.availabilityPattern.timeOfDay) {
        pattern.availabilityPattern.timeOfDay[time as "morning" | "afternoon" | "evening"] /= maxTimeScore;
      }
    }
  }

  return Array.from(patternMap.values());
}

/**
 * Calculate time preferences from polls and events
 */
function calculateTimePreferences(
  polls: Awaited<ReturnType<typeof getHistoricalPolls>>,
  events: Awaited<ReturnType<typeof getFinalizedEvents>>,
): TimePreferences {
  const dayCounts: Record<number, number> = {};
  const hourCounts: Record<number, number> = {};
  const durations: number[] = [];
  const timezoneCounts: Record<string, number> = {};

  // Analyze finalized events (most reliable)
  for (const event of events) {
    if (!event.start || !event.end) continue; // Skip events without valid dates
    
    const date = dayjs(event.start);
    if (!date.isValid()) continue; // Skip invalid dates
    
    const dayOfWeek = date.day();
    const hour = date.hour();
    const duration = dayjs(event.end).diff(dayjs(event.start), "minute");

    dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1;
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    durations.push(duration);

    // Get timezone from poll if available (use first poll if multiple exist)
    const timeZone = event.polls?.[0]?.timeZone || event.timeZone;
    if (timeZone) {
      timezoneCounts[timeZone] = (timezoneCounts[timeZone] || 0) + 1;
    }
  }

  // Analyze polls with most votes (if no finalized events)
  if (events.length === 0) {
    for (const poll of polls) {
      // Find option with most "yes" votes
      const optionScores = poll.options.map((option) => {
        const yesVotes = poll.participants.reduce(
          (count, p) =>
            count +
            p.votes.filter(
              (v) => v.optionId === option.id && v.type === "yes",
            ).length,
          0,
        );
        return { option, score: yesVotes };
      });

      const topOption = optionScores.sort((a, b) => b.score - a.score)[0];
      if (topOption && topOption.score > 0) {
        const date = dayjs(topOption.option.startTime);
        const dayOfWeek = date.day();
        const hour = date.hour();
        const duration = topOption.option.duration;

        dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1;
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        durations.push(duration);
      }

      if (poll.timeZone) {
        timezoneCounts[poll.timeZone] = (timezoneCounts[poll.timeZone] || 0) + 1;
      }
    }
  }

  // Find most common day
  const mostCommonDay = Object.entries(dayCounts).sort(
    ([, a], [, b]) => b - a,
  )[0]?.[0]
    ? (Number(Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0][0]) as 0 | 1 | 2 | 3 | 4 | 5 | 6)
    : 1; // Default to Monday

  // Find most common hour
  const mostCommonTime = Object.entries(hourCounts).sort(
    ([, a], [, b]) => b - a,
  )[0]?.[0]
    ? Number(Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0][0])
    : 14; // Default to 2 PM

  // Calculate average duration
  const averageDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 60; // Default to 60 minutes

  return {
    mostCommonDay,
    mostCommonTime,
    averageDuration,
    timezoneDistribution: timezoneCounts,
  };
}

/**
 * Extract finalized times from events
 */
function extractFinalizedTimes(
  events: Awaited<ReturnType<typeof getFinalizedEvents>>,
): FinalizedTime[] {
  return events
    .filter((event) => {
      // Filter out events without polls, or without valid dates
      if (!event.polls || event.polls.length === 0 || !event.start || !event.end) {
        return false;
      }
      return true;
    })
    .map((event) => {
      // At this point, we know event.polls exists and has at least one poll (from filter above)
      const poll = event.polls[0]!; // Take the first poll
      const participantIds = (poll.participants || []).map(
        (p) => p.email || p.userId || p.id,
      ).filter((id): id is string => !!id); // Filter out undefined/null IDs

      // Calculate success rate (simplified - could be enhanced)
      const totalParticipants = poll.participants?.length || 0;
      const success = totalParticipants > 0; // Simplified success metric

      return {
        pollId: poll.id || "",
        startTime: event.start,
        endTime: event.end,
        participants: participantIds,
        success,
        createdAt: event.createdAt,
      };
    });
}

/**
 * Calculate aggregate statistics
 */
function calculateAggregateStats(
  polls: Awaited<ReturnType<typeof getHistoricalPolls>>,
  events: Awaited<ReturnType<typeof getFinalizedEvents>>,
): AggregateStats {
  const totalVotes = polls.reduce(
    (count, poll) =>
      count +
      (poll.participants || []).reduce(
        (pCount, participant) => pCount + (participant.votes?.length || 0),
        0,
      ),
    0,
  );

  const participantSet = new Set<string>();
  for (const poll of polls) {
    for (const participant of poll.participants || []) {
      const key = participant.email || participant.userId || participant.id;
      if (key) {
        participantSet.add(key);
      }
    }
  }

  const dates = polls
    .map((p) => p.createdAt)
    .filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()));
  const earliest = dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : new Date();
  const latest = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : new Date();

  // Calculate average response rate (simplified)
  const averageResponseRate =
    polls.length > 0
      ? polls.reduce((sum, poll) => {
          const totalOptions = poll.options.length;
          const totalPossibleVotes = poll.participants.length * totalOptions;
          const actualVotes = poll.participants.reduce(
            (count, p) => count + p.votes.length,
            0,
          );
          return sum + (totalPossibleVotes > 0 ? actualVotes / totalPossibleVotes : 0);
        }, 0) / polls.length
      : 0;

  return {
    totalPollsAnalyzed: polls.length,
    totalVotesAnalyzed: totalVotes,
    dateRange: {
      earliest,
      latest,
    },
    participantCount: participantSet.size,
    averageResponseRate,
  };
}

