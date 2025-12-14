/**
 * React hook for fetching AI time suggestions
 */

import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { trpc } from "@/trpc/client";
import type { ParticipantInput, SuggestionRequest } from "../types";

export interface UseTimeSuggestionsOptions {
  participants: ParticipantInput[];
  dateRange: {
    start: Date;
    end: Date;
  };
  duration: number;
  timezone: string;
  excludeTimes?: Date[];
  specificDates?: Date[]; // Specific dates to suggest times for
  preferences?: {
    preferredDays?: number[];
    preferredHours?: number[];
  };
  enabled?: boolean;
}

/**
 * Hook to fetch AI time suggestions
 */
export function useTimeSuggestions(options: UseTimeSuggestionsOptions) {
  const {
    participants,
    dateRange,
    duration,
    timezone,
    excludeTimes,
    specificDates,
    preferences,
    enabled = true,
  } = options;

  // Only enable if we have participants and valid date range
  const shouldFetch =
    enabled &&
    participants.length > 0 &&
    dateRange.start < dateRange.end &&
    duration > 0;

  return trpc.timeSuggestions.generate.useQuery(
    {
      participants,
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
      },
      duration,
      timezone,
      excludeTimes,
      ...(specificDates && specificDates.length > 0 ? { specificDates } : {}), // Only include if provided
      preferences,
    },
    {
      enabled: shouldFetch,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  );
}

/**
 * Hook to check if sufficient data exists for suggestions
 */
export function useCheckDataAvailability(participants: ParticipantInput[], enabled: boolean = true) {
  return trpc.timeSuggestions.checkDataAvailability.useQuery(
    {
      participants: participants.length > 0 ? participants : [],
    },
    {
      enabled: enabled, // Only enable when user is ready
      staleTime: 0, // Don't cache - always fetch fresh data (overrides default 1 minute)
      gcTime: 0, // Don't keep in cache
      refetchOnMount: "always", // Always refetch when component mounts
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnReconnect: true, // Refetch when network reconnects
    },
  );
}

