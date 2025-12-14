/**
 * Pattern Analyzer - Analyzes voting patterns and generates insights
 * for AI time suggestions
 */

import "server-only";

import dayjs from "dayjs";
import type {
  AggregateStats,
  AvailabilityPattern,
  DayOfWeek,
  FinalizedTime,
  HistoricalPollData,
  ParticipantPattern,
  TimePreferences,
} from "../types";

/**
 * Analyze patterns and generate structured data for AI prompt
 */
export function analyzePatterns(
  data: HistoricalPollData,
): {
  patterns: {
    dayOfWeek: Record<string, number>;
    timeOfDay: Record<string, number>;
    averageDuration: number;
  };
  finalizedEvents: Array<{
    dayOfWeek: number;
    hour: number;
    duration: number;
  }>;
  participantCount: number;
  dataQuality: "high" | "medium" | "low";
} {
  // Aggregate day of week patterns
  const dayOfWeekPatterns: Record<string, number> = {};
  const timeOfDayPatterns: Record<string, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
  };

  // Analyze participant patterns
  for (const pattern of data.participantPatterns) {
    // Aggregate day of week preferences
    for (const [day, score] of Object.entries(pattern.availabilityPattern.dayOfWeek)) {
      dayOfWeekPatterns[day] = (dayOfWeekPatterns[day] || 0) + score;
    }

    // Aggregate time of day preferences
    for (const [time, score] of Object.entries(pattern.availabilityPattern.timeOfDay)) {
      timeOfDayPatterns[time] = (timeOfDayPatterns[time] || 0) + score;
    }
  }

  // Normalize day of week patterns
  const maxDayScore = Math.max(...Object.values(dayOfWeekPatterns), 1);
  for (const day in dayOfWeekPatterns) {
    dayOfWeekPatterns[day] = dayOfWeekPatterns[day] / maxDayScore;
  }

  // Normalize time of day patterns
  const maxTimeScore = Math.max(...Object.values(timeOfDayPatterns), 1);
  for (const time in timeOfDayPatterns) {
    timeOfDayPatterns[time] = timeOfDayPatterns[time] / maxTimeScore;
  }

  // Extract finalized event patterns
  const finalizedEvents = data.finalizedTimes.map((event) => {
    const date = dayjs(event.startTime);
    return {
      dayOfWeek: date.day(),
      hour: date.hour(),
      duration: dayjs(event.endTime).diff(dayjs(event.startTime), "minute"),
    };
  });

  // Determine data quality
  const dataQuality = determineDataQuality(data.aggregateStats);

  return {
    patterns: {
      dayOfWeek: dayOfWeekPatterns,
      timeOfDay: timeOfDayPatterns,
      averageDuration: data.timePreferences.averageDuration,
    },
    finalizedEvents,
    participantCount: data.aggregateStats.participantCount,
    dataQuality,
  };
}

/**
 * Determine data quality based on aggregate stats
 */
function determineDataQuality(stats: AggregateStats): "high" | "medium" | "low" {
  if (stats.totalPollsAnalyzed >= 20 && stats.totalVotesAnalyzed >= 50) {
    return "high";
  }
  if (stats.totalPollsAnalyzed >= 5 && stats.totalVotesAnalyzed >= 10) {
    return "medium";
  }
  return "low";
}

/**
 * Find best time slots based on patterns
 */
export function findBestTimeSlots(
  data: HistoricalPollData,
  dateRange: { start: Date; end: Date },
  duration: number,
  specificDates?: Date[], // Optional: if provided, generate slots for these dates regardless of score
): Array<{
  startTime: Date;
  endTime: Date;
  score: number;
  reasoning: string[];
}> {
  const analysis = analyzePatterns(data);
  const suggestions: Array<{
    startTime: Date;
    endTime: Date;
    score: number;
    reasoning: string[];
  }> = [];

  // If specific dates are provided, generate slots for those dates
  if (specificDates && specificDates.length > 0) {
    console.log("[Pattern Analyzer] Generating slots for specific dates:", specificDates.map(d => dayjs(d).format("YYYY-MM-DD")));
    
    // Generate multiple time slots per specific date (morning, afternoon, evening)
    for (const specificDate of specificDates) {
      const date = dayjs(specificDate).startOf("day");
      const dayOfWeek = date.day() as DayOfWeek;
      const dayScore = analysis.patterns.dayOfWeek[dayOfWeek.toString()] || 0.5; // Default to 0.5 if no pattern

      // Generate slots for different times of day
      const timeSlots = [
        { hour: 9, label: "morning" },   // 9 AM
        { hour: 14, label: "afternoon" }, // 2 PM
        { hour: 17, label: "evening" },   // 5 PM
      ];

      for (const timeSlot of timeSlots) {
        const slotTime = date.hour(timeSlot.hour).minute(0);
        const hour = timeSlot.hour;

        // Calculate time of day score
        let timeScore = 0;
        if (hour >= 6 && hour < 12) {
          timeScore = analysis.patterns.timeOfDay.morning || 0.5;
        } else if (hour >= 12 && hour < 18) {
          timeScore = analysis.patterns.timeOfDay.afternoon || 0.5;
        } else if (hour >= 18 && hour < 22) {
          timeScore = analysis.patterns.timeOfDay.evening || 0.5;
        }

        // Check if this time matches finalized events
        const matchesFinalized = analysis.finalizedEvents.some(
          (event) => event.dayOfWeek === dayOfWeek && Math.abs(event.hour - hour) <= 1,
        );

        // Calculate overall score (lower threshold for specific dates)
        const score = dayScore * 0.4 + timeScore * 0.4 + (matchesFinalized ? 0.2 : 0);

        // For specific dates, include all slots (lower threshold)
        if (score > 0.2) {
          const reasoning: string[] = [];
          if (dayScore > 0.7) {
            reasoning.push(`${getDayName(dayOfWeek)} preference`);
          } else {
            reasoning.push(`Selected ${getDayName(dayOfWeek)}`);
          }
          if (timeScore > 0.7) {
            reasoning.push(`${getTimeOfDayName(hour)} availability`);
          } else {
            reasoning.push(`${getTimeOfDayName(hour)} time`);
          }
          if (matchesFinalized) {
            reasoning.push("Matches finalized poll times");
          }

          suggestions.push({
            startTime: slotTime.toDate(),
            endTime: slotTime.add(duration, "minute").toDate(),
            score,
            reasoning,
          });
        }
      }
    }

    // Sort by score and return top suggestions
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  // Original logic: Generate candidate time slots for the date range
  const start = dayjs(dateRange.start);
  const end = dayjs(dateRange.end);
  let current = start;

  while (current.isBefore(end)) {
    const dayOfWeek = current.day() as DayOfWeek;
    const hour = current.hour();
    const dayScore = analysis.patterns.dayOfWeek[dayOfWeek.toString()] || 0;

    // Skip if day has low score
    if (dayScore < 0.3) {
      current = current.add(1, "day");
      continue;
    }

    // Calculate time of day score
    let timeScore = 0;
    if (hour >= 6 && hour < 12) {
      timeScore = analysis.patterns.timeOfDay.morning;
    } else if (hour >= 12 && hour < 18) {
      timeScore = analysis.patterns.timeOfDay.afternoon;
    } else if (hour >= 18 && hour < 22) {
      timeScore = analysis.patterns.timeOfDay.evening;
    }

    // Check if this time matches finalized events
    const matchesFinalized = analysis.finalizedEvents.some(
      (event) => event.dayOfWeek === dayOfWeek && Math.abs(event.hour - hour) <= 1,
    );

    // Calculate overall score
    const score = dayScore * 0.4 + timeScore * 0.4 + (matchesFinalized ? 0.2 : 0);

    if (score > 0.4) {
      // Only include suggestions with decent score
      const reasoning: string[] = [];
      if (dayScore > 0.7) {
        reasoning.push(`${getDayName(dayOfWeek)} preference`);
      }
      if (timeScore > 0.7) {
        reasoning.push(`${getTimeOfDayName(hour)} availability`);
      }
      if (matchesFinalized) {
        reasoning.push("Matches finalized poll times");
      }

      suggestions.push({
        startTime: current.toDate(),
        endTime: current.add(duration, "minute").toDate(),
        score,
        reasoning,
      });
    }

    current = current.add(1, "day");
  }

  // Sort by score and return top suggestions
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
}

/**
 * Get day name from day of week number
 */
function getDayName(day: DayOfWeek): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[day];
}

/**
 * Get time of day name from hour
 */
function getTimeOfDayName(hour: number): string {
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 18) return "Afternoon";
  if (hour >= 18 && hour < 22) return "Evening";
  return "Night";
}

/**
 * Generate pattern match descriptions for AI
 */
export function generatePatternMatches(
  data: HistoricalPollData,
): string[] {
  const matches: string[] = [];
  const analysis = analyzePatterns(data);

  // Find strongest day preference
  const topDay = Object.entries(analysis.patterns.dayOfWeek).sort(
    ([, a], [, b]) => b - a,
  )[0];
  if (topDay && Number(topDay[1]) > 0.7) {
    const dayName = getDayName(Number(topDay[0]) as DayOfWeek);
    matches.push(`${dayName} preference`);
  }

  // Find strongest time preference
  const topTime = Object.entries(analysis.patterns.timeOfDay).sort(
    ([, a], [, b]) => b - a,
  )[0];
  if (topTime && Number(topTime[1]) > 0.7) {
    matches.push(`${topTime[0]} availability`);
  }

  // Check for finalized event patterns
  if (analysis.finalizedEvents.length > 0) {
    matches.push(`Based on ${analysis.finalizedEvents.length} finalized polls`);
  }

  return matches;
}


