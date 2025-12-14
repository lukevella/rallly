/**
 * Response Parser - Parses AI responses into structured suggestions
 */

import "server-only";

import dayjs from "dayjs";
import type {
  ParticipantInput,
  SuggestionRequest,
  TimeSuggestion,
} from "../types";

export interface RawAISuggestion {
  startTime: string;
  endTime: string;
  confidence: number;
  reasoning: string;
}

/**
 * Parse AI response text into structured suggestions
 */
export function parseAIResponse(
  responseText: string,
  request: SuggestionRequest,
  historicalData: {
    aggregateStats: { totalPollsAnalyzed: number; totalVotesAnalyzed: number };
    participantPatterns: Array<{ participantId: string; email?: string }>;
  },
): TimeSuggestion[] {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith("```")) {
      const lines = jsonText.split("\n");
      // Remove first line (```json or ```)
      lines.shift();
      // Remove last line (```)
      if (lines[lines.length - 1].trim() === "```") {
        lines.pop();
      }
      jsonText = lines.join("\n").trim();
    }

    // Parse JSON
    const rawSuggestions = JSON.parse(jsonText) as RawAISuggestion[];

    if (!Array.isArray(rawSuggestions)) {
      throw new Error("AI response is not an array");
    }

    console.log("[Response Parser] Raw AI suggestions received:", {
      count: rawSuggestions.length,
      specificDates: request.specificDates?.map(d => dayjs(d).format("YYYY-MM-DD")),
      rawSuggestionsDates: rawSuggestions.slice(0, 5).map(r => {
        try {
          return dayjs(r.startTime).format("YYYY-MM-DD");
        } catch {
          return "invalid";
        }
      }),
    });

    // Validate and transform suggestions
    const suggestions: TimeSuggestion[] = [];
    const seenTimes = new Set<string>();

    for (const raw of rawSuggestions.slice(0, 10)) {
      // Validate required fields
      if (!raw.startTime || !raw.endTime) {
        continue;
      }

      // Parse dates
      const startTime = dayjs(raw.startTime);
      const endTime = dayjs(raw.endTime);

      if (!startTime.isValid() || !endTime.isValid()) {
        continue;
      }

      // Check if within date range
      const requestStart = dayjs(request.dateRange.start);
      const requestEnd = dayjs(request.dateRange.end);

      if (
        startTime.isBefore(requestStart) ||
        endTime.isAfter(requestEnd) ||
        startTime.isAfter(requestEnd)
      ) {
        continue;
      }

      // If specific dates are provided, only include suggestions for those dates
      if (request.specificDates && request.specificDates.length > 0) {
        const suggestionDateStr = startTime.format("YYYY-MM-DD");
        const specificDateStrs = request.specificDates.map(d => dayjs(d).format("YYYY-MM-DD"));
        const matchesSpecificDate = specificDateStrs.includes(suggestionDateStr);
        
        if (!matchesSpecificDate) {
          console.log("[Response Parser] Filtering out suggestion - date mismatch:", {
            suggestionDate: suggestionDateStr,
            specificDates: specificDateStrs,
            suggestionTime: startTime.format("YYYY-MM-DD HH:mm"),
          });
          continue; // Skip this suggestion if it doesn't match a specific date
        } else {
          console.log("[Response Parser] ✅ Suggestion matches specific date:", {
            suggestionDate: suggestionDateStr,
            suggestionTime: startTime.format("YYYY-MM-DD HH:mm"),
          });
        }
      }

      // Check duration matches
      const actualDuration = endTime.diff(startTime, "minute");
      const expectedDuration = request.duration;
      if (Math.abs(actualDuration - expectedDuration) > 5) {
        // Allow 5 minute tolerance
        continue;
      }

      // Check for duplicates
      const timeKey = `${startTime.toISOString()}-${endTime.toISOString()}`;
      if (seenTimes.has(timeKey)) {
        continue;
      }
      seenTimes.add(timeKey);

      // Check if excluded
      if (request.excludeTimes) {
        const isExcluded = request.excludeTimes.some((excluded) => {
          const excludedTime = dayjs(excluded);
          return (
            startTime.isSame(excludedTime, "day") &&
            Math.abs(startTime.diff(excludedTime, "hour")) < 1
          );
        });
        if (isExcluded) {
          continue;
        }
      }

      // Validate confidence
      const confidence = Math.max(0, Math.min(100, raw.confidence || 50));

      // Generate ID
      const id = `sugg-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Calculate source data metrics
      const similarPolls = historicalData.aggregateStats.totalPollsAnalyzed;
      const participantMatches = historicalData.participantPatterns.length;

      // Extract pattern matches from reasoning
      const patternMatches: string[] = [];
      if (raw.reasoning) {
        // Simple extraction - could be enhanced
        if (raw.reasoning.toLowerCase().includes("tuesday")) {
          patternMatches.push("Tuesday preference");
        }
        if (raw.reasoning.toLowerCase().includes("afternoon")) {
          patternMatches.push("Afternoon availability");
        }
        if (raw.reasoning.toLowerCase().includes("morning")) {
          patternMatches.push("Morning availability");
        }
        if (raw.reasoning.toLowerCase().includes("evening")) {
          patternMatches.push("Evening availability");
        }
      }

      // Build participant timezones map
      const participantTimezones: Record<string, string> = {};
      for (const participant of request.participants) {
        if (participant.email && participant.timeZone) {
          participantTimezones[participant.email] = participant.timeZone;
        }
      }

      suggestions.push({
        id,
        startTime: startTime.toDate(),
        endTime: endTime.toDate(),
        confidence,
        reasoning: raw.reasoning || "Based on historical patterns",
        sourceData: {
          similarPolls,
          participantMatches,
          patternMatches,
        },
        timezoneInfo: {
          pollTimezone: request.timezone,
          participantTimezones,
        },
      });
    }

    console.log("[Response Parser] Final suggestions after all filtering:", {
      count: suggestions.length,
      suggestionDates: suggestions.map(s => dayjs(s.startTime).format("YYYY-MM-DD HH:mm")),
    });

    return suggestions;
  } catch (error) {
    console.error("Error parsing AI response:", error);
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Validate AI response structure
 */
export function validateAIResponse(responseText: string): {
  valid: boolean;
  error?: string;
} {
  try {
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith("```")) {
      const lines = jsonText.split("\n");
      lines.shift();
      if (lines[lines.length - 1].trim() === "```") {
        lines.pop();
      }
      jsonText = lines.join("\n").trim();
    }

    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed)) {
      return {
        valid: false,
        error: "Response is not an array",
      };
    }

    if (parsed.length === 0) {
      return {
        valid: false,
        error: "Response array is empty",
      };
    }

    // Validate first item structure
    const first = parsed[0];
    if (!first.startTime || !first.endTime) {
      return {
        valid: false,
        error: "Missing required fields: startTime or endTime",
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
}

