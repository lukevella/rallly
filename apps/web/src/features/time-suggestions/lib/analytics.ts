/**
 * Analytics tracking for AI Time Suggestions feature
 */

import { usePostHog } from "@rallly/posthog/client";

export interface SuggestionAnalyticsEvent {
  action: "view" | "apply" | "dismiss" | "generate" | "error";
  suggestionId?: string;
  confidence?: number;
  dataQuality?: "high" | "medium" | "low";
  cacheHit?: boolean;
  errorType?: string;
}

/**
 * Track AI suggestion events
 */
export function useTrackSuggestions() {
  const posthog = usePostHog();

  return {
    trackView: (dataQuality: "high" | "medium" | "low", suggestionCount: number) => {
      posthog?.capture("ai_suggestions_viewed", {
        data_quality: dataQuality,
        suggestion_count: suggestionCount,
      });
    },
    trackApply: (suggestionId: string, confidence: number) => {
      posthog?.capture("ai_suggestion_applied", {
        suggestion_id: suggestionId,
        confidence,
      });
    },
    trackDismiss: (suggestionId: string) => {
      posthog?.capture("ai_suggestion_dismissed", {
        suggestion_id: suggestionId,
      });
    },
    trackGenerate: (
      dataQuality: "high" | "medium" | "low",
      cacheHit: boolean,
      suggestionCount: number,
    ) => {
      posthog?.capture("ai_suggestions_generated", {
        data_quality: dataQuality,
        cache_hit: cacheHit,
        suggestion_count: suggestionCount,
      });
    },
    trackError: (errorType: string, errorMessage: string) => {
      posthog?.capture("ai_suggestions_error", {
        error_type: errorType,
        error_message: errorMessage,
      });
    },
  };
}


