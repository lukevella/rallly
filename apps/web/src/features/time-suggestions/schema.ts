/**
 * Zod schemas for AI Time Suggestions feature
 * Based on API contracts specifications
 */

import { z } from "zod";

/**
 * Participant input schema
 */
export const participantInputSchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().optional(),
  name: z.string().min(1).max(100),
  timeZone: z.string().optional(),
});

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
}).refine(
  (data) => data.end > data.start,
  {
    message: "End date must be after start date",
    path: ["end"],
  }
);

/**
 * Preferences schema
 */
export const preferencesSchema = z.object({
  preferredDays: z.array(z.number().int().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
  preferredHours: z.array(z.number().int().min(0).max(23)).optional(),
}).optional();

/**
 * Suggestion request schema (for tRPC input)
 */
export const suggestionRequestSchema = z.object({
  participants: z.array(participantInputSchema).min(1).max(50),
  dateRange: dateRangeSchema,
  duration: z.number().int().min(15).max(480), // 15 minutes to 8 hours
  timezone: z.string(), // IANA timezone
  excludeTimes: z.array(z.date()).optional(),
  preferences: preferencesSchema,
}).refine(
  (data) => {
    // Validate date range is not too large (max 90 days)
    const daysDiff = Math.ceil(
      (data.dateRange.end.getTime() - data.dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 90;
  },
  {
    message: "Date range cannot exceed 90 days",
    path: ["dateRange"],
  }
).refine(
  (data) => {
    // Validate start date is not in the past
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(data.dateRange.start);
    start.setHours(0, 0, 0, 0);
    return start >= now;
  },
  {
    message: "Start date cannot be in the past",
    path: ["dateRange", "start"],
  }
).refine(
  (data) => {
    // Validate end date is not more than 1 year in the future
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    return data.dateRange.end <= oneYearFromNow;
  },
  {
    message: "End date cannot be more than 1 year in the future",
    path: ["dateRange", "end"],
  }
);

/**
 * Source data schema
 */
export const sourceDataSchema = z.object({
  similarPolls: z.number().int().min(0),
  participantMatches: z.number().int().min(0),
  patternMatches: z.array(z.string()),
});

/**
 * Timezone info schema
 */
export const timezoneInfoSchema = z.object({
  pollTimezone: z.string(),
  participantTimezones: z.record(z.string(), z.string()),
});

/**
 * Time suggestion schema
 */
export const timeSuggestionSchema = z.object({
  id: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  confidence: z.number().int().min(0).max(100),
  reasoning: z.string(),
  sourceData: sourceDataSchema,
  timezoneInfo: timezoneInfoSchema,
});

/**
 * Suggestion response metadata schema
 */
export const suggestionMetadataSchema = z.object({
  dataQuality: z.enum(["high", "medium", "low"]),
  totalPollsAnalyzed: z.number().int().min(0),
  totalVotesAnalyzed: z.number().int().min(0),
  cacheHit: z.boolean(),
  generatedAt: z.date(),
});

/**
 * Suggestion response schema (for tRPC output)
 */
export const suggestionResponseSchema = z.object({
  suggestions: z.array(timeSuggestionSchema),
  metadata: suggestionMetadataSchema,
});

/**
 * Type exports for use in code
 */
export type ParticipantInput = z.infer<typeof participantInputSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type SuggestionRequest = z.infer<typeof suggestionRequestSchema>;
export type TimeSuggestion = z.infer<typeof timeSuggestionSchema>;
export type SuggestionResponse = z.infer<typeof suggestionResponseSchema>;
export type SuggestionMetadata = z.infer<typeof suggestionMetadataSchema>;


