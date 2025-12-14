/**
 * AI Service - Main integration with OpenAI for time suggestions
 */

import "server-only";

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import dayjs from "dayjs";
import { env } from "@/env";
import { rateLimit } from "@/lib/rate-limit";
import { findBestTimeSlots } from "./pattern-analyzer";
import { buildSuggestionPrompt } from "./prompt-builder";
import { parseAIResponse, validateAIResponse } from "./response-parser";
import type {
  HistoricalPollData,
  SuggestionRequest,
  TimeSuggestion,
} from "../types";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const MODEL = "gpt-4o-mini"; // Using mini for cost efficiency
const RATE_LIMIT_NAME = "ai-time-suggestions";
const RATE_LIMIT_REQUESTS = 10; // 10 requests per minute

/**
 * Generate AI-powered time suggestions
 */
export async function generateAISuggestions(
  request: SuggestionRequest,
  historicalData: HistoricalPollData,
): Promise<TimeSuggestion[]> {
  // Check rate limit
  const rateLimitResult = await rateLimit(
    RATE_LIMIT_NAME,
    RATE_LIMIT_REQUESTS,
    "1 m",
  );

  if (!rateLimitResult.success) {
    console.warn(
      "Rate limit exceeded for AI suggestions. Using rule-based fallback.",
    );
    return generateFallbackSuggestions(request, historicalData);
  }

  // Check if OpenAI API key is available
  if (!env.OPENAI_API_KEY) {
    console.warn(
      "OpenAI API key not configured. Falling back to rule-based suggestions.",
    );
    return generateFallbackSuggestions(request, historicalData);
  }

  // Check data quality
  const pollCount = historicalData.aggregateStats.totalPollsAnalyzed;
  const voteCount = historicalData.aggregateStats.totalVotesAnalyzed;

  if (pollCount < 3 || voteCount < 5) {
    console.info(
      "Insufficient historical data for AI suggestions. Using rule-based fallback.",
    );
    return generateFallbackSuggestions(request, historicalData);
  }

  // Build prompt
  const prompt = buildSuggestionPrompt(request, historicalData);

  // Generate suggestions with retry logic
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await generateText({
        model: openai(MODEL),
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI assistant that suggests optimal meeting times based on historical scheduling patterns. Always respond with valid JSON arrays only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7, // Some creativity but still focused
        maxTokens: 2000,
      });

      // Validate response
      const validation = validateAIResponse(response.text);
      if (!validation.valid) {
        throw new Error(
          `Invalid AI response: ${validation.error || "Unknown error"}`,
        );
      }

      // Parse response
      console.log("[AI Service] Parsing AI response, specificDates:", request.specificDates?.map(d => dayjs(d).format("YYYY-MM-DD")));
      const suggestions = parseAIResponse(
        response.text,
        request,
        historicalData,
      );

      console.log("[AI Service] Parsed suggestions count:", suggestions.length, {
        totalBeforeFilter: "unknown",
        specificDates: request.specificDates?.map(d => dayjs(d).format("YYYY-MM-DD")),
        suggestionsDates: suggestions.map(s => dayjs(s.startTime).format("YYYY-MM-DD")),
      });

      if (suggestions.length === 0) {
        console.warn(
          "[AI Service] AI returned no valid suggestions after filtering. Using rule-based fallback.",
          {
            specificDates: request.specificDates?.map(d => dayjs(d).format("YYYY-MM-DD")),
            dateRange: {
              start: dayjs(request.dateRange.start).format("YYYY-MM-DD"),
              end: dayjs(request.dateRange.end).format("YYYY-MM-DD"),
            },
          },
        );
        return generateFallbackSuggestions(request, historicalData);
      }

      return suggestions;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `AI suggestion generation attempt ${attempt}/${MAX_RETRIES} failed:`,
        lastError,
      );

      // If not the last attempt, wait before retrying
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed - use fallback
  console.error(
    "All AI suggestion attempts failed. Using rule-based fallback.",
    lastError,
  );
  return generateFallbackSuggestions(request, historicalData);
}

/**
 * Generate fallback suggestions using rule-based logic
 * This is used when AI is unavailable or data is insufficient
 */
function generateFallbackSuggestions(
  request: SuggestionRequest,
  historicalData: HistoricalPollData,
): TimeSuggestion[] {
  // Use pattern analyzer to find best time slots
  // Pass specificDates if provided so it generates slots for those dates
  const ruleBasedSlots = findBestTimeSlots(
    historicalData,
    request.dateRange,
    request.duration,
    request.specificDates, // Pass specific dates to pattern analyzer
  );

  console.log("[AI Service] Fallback: Generated", ruleBasedSlots.length, "rule-based slots", {
    specificDates: request.specificDates?.map(d => dayjs(d).format("YYYY-MM-DD")),
    slotsDates: ruleBasedSlots.map(s => dayjs(s.startTime).format("YYYY-MM-DD")),
  });

  // Transform to TimeSuggestion format
  // Note: If specificDates were passed to findBestTimeSlots, slots are already filtered
  // But we still filter here as a safety check
  const suggestions: TimeSuggestion[] = ruleBasedSlots
    .filter((slot) => {
      // If specific dates are provided, only include suggestions for those dates
      if (request.specificDates && request.specificDates.length > 0) {
        const slotDateStr = dayjs(slot.startTime).format("YYYY-MM-DD");
        const specificDateStrs = request.specificDates.map(d => dayjs(d).format("YYYY-MM-DD"));
        const matches = specificDateStrs.includes(slotDateStr);
        if (!matches) {
          console.log("[AI Service] Fallback: Filtering out slot - date mismatch:", {
            slotDate: slotDateStr,
            specificDates: specificDateStrs,
          });
        }
        return matches;
      }
      return true;
    })
    .map((slot, index) => {
    // Calculate participant timezones
    const participantTimezones: Record<string, string> = {};
    for (const participant of request.participants) {
      if (participant.email && participant.timeZone) {
        participantTimezones[participant.email] = participant.timeZone;
      }
    }

    return {
      id: `fallback-${Date.now()}-${index}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      confidence: Math.round(slot.score * 100),
      reasoning: slot.reasoning.join(". ") || "Based on historical patterns",
      sourceData: {
        similarPolls: historicalData.aggregateStats.totalPollsAnalyzed,
        participantMatches: historicalData.participantPatterns.length,
        patternMatches: slot.reasoning,
      },
      timezoneInfo: {
        pollTimezone: request.timezone,
        participantTimezones,
      },
    };
  });

  return suggestions;
}

/**
 * Check if AI suggestions are available
 */
export function isAIAvailable(): boolean {
  return !!env.OPENAI_API_KEY;
}

/**
 * Check if sufficient data exists for AI suggestions
 */
export function hasSufficientDataForAI(
  historicalData: HistoricalPollData,
): boolean {
  const pollCount = historicalData.aggregateStats.totalPollsAnalyzed;
  const voteCount = historicalData.aggregateStats.totalVotesAnalyzed;
  return pollCount >= 3 && voteCount >= 5;
}

