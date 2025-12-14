/**
 * Main panel component for AI time suggestions
 * Integrates with poll creation form
 */

"use client";

import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rallly/ui/collapsible";
import { InfoIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon, AlertCircleIcon } from "lucide-react";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import dayjs from "dayjs";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { getBrowserTimeZone } from "@/utils/date-time-utils";
import { Spinner } from "@/components/spinner";
import { AISuggestionsErrorBoundary } from "../lib/error-boundary";
import { useTrackSuggestions } from "../lib/analytics";
import { useTimeSuggestions, useCheckDataAvailability } from "../hooks/use-time-suggestions";
import { SuggestionsList } from "./suggestions-list";
import type { TimeSuggestion } from "../types";
import type { NewEventData } from "@/components/forms/types";
import type { DateTimeOption } from "@/components/forms/poll-options-form/types";

export interface AISuggestionsPanelProps {
  participants?: Array<{ email?: string; userId?: string; name: string; timeZone?: string }>;
  dateRange?: { start: Date; end: Date };
  enabled?: boolean;
}

/**
 * Panel component that shows AI suggestions and allows applying them to the form
 */
export function AISuggestionsPanel({
  participants = [],
  dateRange,
  enabled = true,
}: AISuggestionsPanelProps) {
  const form = useFormContext<NewEventData>();
  const { user } = useUser();
  const track = useTrackSuggestions();
  const [isOpen, setIsOpen] = useState(false);

  // Check if user is available and authenticated (has email)
  // Even if isGuest is true, if they have an email they're authenticated
  const isUserReady = user && "email" in user && !!user.email;

  const watchDuration = form.watch("duration");
  const watchTimezone = form.watch("timeZone");
  const watchOptions = form.watch("options");
  const watchNavigationDate = form.watch("navigationDate");

  // Extract dates from selected options (dates or time slots)
  const selectedDates = React.useMemo(() => {
    console.log("[AI Panel] watchOptions changed:", {
      watchOptions,
      optionsLength: watchOptions?.length || 0,
      options: watchOptions?.map(opt => ({
        type: opt.type,
        date: "date" in opt ? opt.date : undefined,
        start: "start" in opt ? opt.start : undefined,
      })),
    });

    if (!watchOptions || watchOptions.length === 0) {
      console.log("[AI Panel] No options selected");
      return [];
    }
    
    const dates: Date[] = [];
    for (const option of watchOptions) {
      if (option.type === "date") {
        // Date-only option
        try {
          const date = dayjs(option.date).startOf("day").toDate();
          if (date && !isNaN(date.getTime())) {
            dates.push(date);
            console.log("[AI Panel] Found date option:", {
              date: option.date,
              parsed: dayjs(option.date).format("YYYY-MM-DD"),
              isValid: true,
            });
          } else {
            console.warn("[AI Panel] Invalid date option:", option.date);
          }
        } catch (e) {
          console.error("[AI Panel] Error parsing date option:", option.date, e);
        }
      } else if (option.type === "timeSlot") {
        // Time slot option - extract the date
        try {
          const date = dayjs(option.start).startOf("day").toDate();
          if (date && !isNaN(date.getTime())) {
            dates.push(date);
            console.log("[AI Panel] Found timeSlot option:", {
              start: option.start,
              parsed: dayjs(option.start).format("YYYY-MM-DD"),
              isValid: true,
            });
          } else {
            console.warn("[AI Panel] Invalid timeSlot option:", option.start);
          }
        } catch (e) {
          console.error("[AI Panel] Error parsing timeSlot option:", option.start, e);
        }
      } else {
        console.warn("[AI Panel] Unknown option type:", option);
      }
    }
    
    // Remove duplicates and sort
    const uniqueDates = Array.from(
      new Set(dates.map(d => d.toISOString().split("T")[0]))
    )
      .map(dateStr => dayjs(dateStr).startOf("day").toDate())
      .sort((a, b) => a.getTime() - b.getTime());
    
    console.log("[AI Panel] Extracted selected dates:", {
      totalOptions: watchOptions.length,
      extractedDates: dates.length,
      uniqueDates: uniqueDates.map(d => dayjs(d).format("YYYY-MM-DD")),
      uniqueDatesCount: uniqueDates.length,
    });
    
    return uniqueDates;
  }, [watchOptions]);

  // Determine date range from selected dates or props
  const effectiveDateRange = React.useMemo(() => {
    // If user has selected dates, use those
    if (selectedDates.length > 0) {
      const earliest = selectedDates[0]!;
      const latest = selectedDates[selectedDates.length - 1]!;
      return {
        start: dayjs(earliest).startOf("day").toDate(),
        end: dayjs(latest).endOf("day").toDate(),
      };
    }
    
    // If dateRange prop is provided, use that
    if (dateRange) {
      return dateRange;
    }
    
    // Default to next 2 weeks from navigation date or today
    const startDate = watchNavigationDate
      ? dayjs(watchNavigationDate)
      : dayjs();
    return {
      start: startDate.toDate(),
      end: startDate.add(14, "days").toDate(),
    };
  }, [selectedDates, dateRange, watchNavigationDate]);

  const effectiveTimezone = watchTimezone || getBrowserTimeZone();

  // Use provided participants, or fall back to current user if available
  // This allows suggestions based on the current user's historical polls
  const effectiveParticipants = participants.length > 0 
    ? participants 
    : (isUserReady && "email" in user && user.email
        ? [{ email: user.email, name: "name" in user ? user.name || "User" : "User", userId: user.id }]
        : []); // Empty array will analyze all accessible polls

  // Check data availability first - only when user is ready
  const { data: dataAvailability, isLoading: checkingData, error: dataAvailabilityError, refetch: refetchDataAvailability } = useCheckDataAvailability(
    effectiveParticipants,
    isUserReady // Only enable query when user is ready
  );

  // Debug logging (remove in production)
  React.useEffect(() => {
    const hasEmail = user && "email" in user;
    const emailValue = hasEmail ? user.email : null;
    const emailTruthy = !!emailValue;
    
    console.log("[AI Panel Frontend] User state:", {
      user: user ? { id: user.id, email: "email" in user ? user.email : "no email", isGuest: "isGuest" in user ? (user as any).isGuest : "no isGuest" } : null,
      isUserReady,
      effectiveParticipants,
      checkDetails: {
        userExists: !!user,
        hasEmailProperty: hasEmail,
        emailValue,
        emailTruthy,
        finalCheck: user && hasEmail && emailTruthy,
      },
    });
  }, [user, isUserReady, effectiveParticipants]);

  React.useEffect(() => {
    if (dataAvailability) {
      console.log("=".repeat(80));
      console.log("[AI Panel Frontend] ✅ Data availability received:", {
        hasData: dataAvailability.hasData,
        pollCount: dataAvailability.pollCount,
        voteCount: dataAvailability.voteCount,
        quality: dataAvailability.quality,
        fullData: dataAvailability,
      });
      console.log("[AI Panel Frontend] Type check:", {
        hasDataType: typeof dataAvailability.hasData,
        hasDataValue: dataAvailability.hasData,
        pollCountType: typeof dataAvailability.pollCount,
        pollCountValue: dataAvailability.pollCount,
        isHasDataTrue: dataAvailability.hasData === true,
        isHasDataTruthy: !!dataAvailability.hasData,
        willShowInsufficient: !dataAvailability.hasData,
      });
      console.log("=".repeat(80));
      
      // If we have polls but hasData is false, log a warning
      if (dataAvailability.pollCount >= 3 && !dataAvailability.hasData) {
        console.error("⚠️ [AI Panel Frontend] BUG DETECTED: pollCount >= 3 but hasData is false!");
        console.error("   This should not happen. Check the hasSufficientData function.");
      }
    }
    if (dataAvailabilityError) {
      console.error("[AI Panel Frontend] Data availability error:", dataAvailabilityError);
    }
    if (checkingData) {
      console.log("[AI Panel Frontend] Checking data availability...");
    }
  }, [dataAvailability, dataAvailabilityError, checkingData]);

  // Determine if query should be enabled
  const queryEnabled = React.useMemo(() => {
    const result = enabled && isOpen && isUserReady && dataAvailability?.hasData === true && selectedDates.length > 0;
    console.log("[AI Panel] Query enabled check:", {
      enabled,
      isOpen,
      isUserReady,
      hasData: dataAvailability?.hasData,
      selectedDatesCount: selectedDates.length,
      result,
    });
    return result;
  }, [enabled, isOpen, isUserReady, dataAvailability?.hasData, selectedDates.length]);

  // Fetch suggestions - only when panel is open, user is ready, data is available, and dates are selected
  const {
    data: suggestionsData,
    isLoading: loadingSuggestions,
    error,
    refetch,
  } = useTimeSuggestions({
    participants: effectiveParticipants,
    dateRange: effectiveDateRange,
    duration: watchDuration || 60,
    timezone: effectiveTimezone,
    specificDates: selectedDates.length > 0 ? selectedDates : undefined, // Pass specific dates to AI
    enabled: queryEnabled,
  });

  // Debug: Log when suggestions are received
  React.useEffect(() => {
    if (suggestionsData) {
      console.log("[AI Panel] Suggestions received:", {
        totalSuggestions: suggestionsData.suggestions.length,
        suggestions: suggestionsData.suggestions.map(s => ({
          date: dayjs(s.startTime).format("YYYY-MM-DD"),
          time: dayjs(s.startTime).format("HH:mm"),
          full: dayjs(s.startTime).format("YYYY-MM-DD HH:mm"),
        })),
        selectedDates: selectedDates.map(d => dayjs(d).format("YYYY-MM-DD")),
      });
    }
  }, [suggestionsData, selectedDates]);

  // Filter suggestions to only show times for selected dates
  const filteredSuggestions = React.useMemo(() => {
    if (!suggestionsData?.suggestions) {
      console.log("[AI Panel] No suggestions data available");
      return [];
    }

    // If no dates selected, return all suggestions (fallback)
    if (selectedDates.length === 0) {
      console.log("[AI Panel] No dates selected, returning all suggestions");
      return suggestionsData.suggestions;
    }

    // Debug logging
    console.log("[AI Panel] Filtering suggestions:", {
      totalSuggestions: suggestionsData.suggestions.length,
      selectedDates: selectedDates.map(d => dayjs(d).format("YYYY-MM-DD")),
      selectedDatesCount: selectedDates.length,
      allSuggestionDates: suggestionsData.suggestions.map(s => dayjs(s.startTime).format("YYYY-MM-DD")),
    });

    // Only show suggestions for dates the user has selected
    const filtered = suggestionsData.suggestions.filter((suggestion) => {
      const suggestionDate = dayjs(suggestion.startTime);
      const suggestionDateStr = suggestionDate.format("YYYY-MM-DD");
      
      const matches = selectedDates.some((selectedDate) => {
        const selectedDateStr = dayjs(selectedDate).format("YYYY-MM-DD");
        const isMatch = selectedDateStr === suggestionDateStr;
        return isMatch;
      });
      
      return matches;
    });

    console.log("[AI Panel] Filtered suggestions result:", {
      before: suggestionsData.suggestions.length,
      after: filtered.length,
      filteredDates: filtered.map(s => dayjs(s.startTime).format("YYYY-MM-DD HH:mm")),
    });

    // If filtering removed all suggestions, show all suggestions with a warning
    // This handles the case where AI generated suggestions but they don't match selected dates
    if (filtered.length === 0 && suggestionsData.suggestions.length > 0) {
      console.warn("[AI Panel] ⚠️ All suggestions filtered out! Showing all suggestions instead.");
      return suggestionsData.suggestions;
    }

    return filtered;
  }, [suggestionsData?.suggestions, selectedDates]);

  const handleApplySuggestion = (suggestion: TimeSuggestion) => {
    const startTime = dayjs(suggestion.startTime);
    const endTime = dayjs(suggestion.endTime);

    // Convert to DateTimeOption format
    const newOption: DateTimeOption = {
      type: "timeSlot",
      start: startTime.format("YYYY-MM-DDTHH:mm:ss"),
      end: endTime.format("YYYY-MM-DDTHH:mm:ss"),
      duration: endTime.diff(startTime, "minute"),
    };

    // Add to existing options if not already present
    const existingOptions = watchOptions || [];
    const alreadyExists = existingOptions.some(
      (opt) =>
        opt.type === "timeSlot" &&
        opt.start === newOption.start &&
        opt.end === newOption.end,
    );

    if (!alreadyExists) {
      form.setValue("options", [...existingOptions, newOption]);
      
      // Ensure timezone is set if not already
      if (!watchTimezone) {
        form.setValue("timeZone", effectiveTimezone);
      }

      // Track analytics
      track.trackApply(suggestion.id, suggestion.confidence);
    }
  };

  const handleDismissSuggestion = (suggestion: TimeSuggestion) => {
    track.trackDismiss(suggestion.id);
  };

  // Track when suggestions are generated
  React.useEffect(() => {
    if (suggestionsData && !loadingSuggestions) {
      track.trackGenerate(
        suggestionsData.metadata.dataQuality,
        suggestionsData.metadata.cacheHit,
        suggestionsData.suggestions.length,
      );
    }
  }, [suggestionsData, loadingSuggestions, track]);

  // Track when panel is opened and suggestions are viewed
  React.useEffect(() => {
    if (isOpen && suggestionsData && !loadingSuggestions) {
      track.trackView(
        suggestionsData.metadata.dataQuality,
        suggestionsData.suggestions.length,
      );
    }
  }, [isOpen, suggestionsData, loadingSuggestions, track]);

  // Track errors
  React.useEffect(() => {
    if (error) {
      track.trackError(
        error.name || "UnknownError",
        error.message || "Unknown error occurred",
      );
    }
  }, [error, track]);


  // For poll creation, we don't have participants yet
  // The suggestions will be based on the current user's historical data
  // In the future, this could be enhanced to use space members or previous poll participants

  // Always show the panel when time slots are enabled, even if data check is in progress or failed
  // This ensures users can see what's happening and get feedback

  // Show loading state while checking data availability
  if (checkingData) {
    return (
      <AISuggestionsErrorBoundary onRetry={refetch}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="secondary"
              className="w-full justify-between border-t"
              type="button"
            >
              <span className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-primary-500" />
                <Trans i18nKey="aiSuggestions" defaults="AI Time Suggestions" />
                <Spinner className="size-4" />
              </span>
              {isOpen ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          {isOpen && (
            <CollapsibleContent className="mt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
                <Spinner className="size-4" />
                <Trans i18nKey="checkingDataAvailability" defaults="Checking data availability..." />
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </AISuggestionsErrorBoundary>
    );
  }

  // Show message if insufficient data, but still show the panel
  if (dataAvailability && !dataAvailability.hasData) {
    return (
      <AISuggestionsErrorBoundary onRetry={refetch}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="secondary"
              className="w-full justify-between border-t"
              type="button"
            >
              <span className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-primary-500" />
                <Trans i18nKey="aiSuggestions" defaults="AI Time Suggestions" />
              </span>
              {isOpen ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          {isOpen && (
            <CollapsibleContent className="mt-3">
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <Trans
                      i18nKey="insufficientDataForSuggestions"
                      defaults="We need at least 3 historical polls to provide AI suggestions. You currently have {{count}}."
                      values={{ count: dataAvailability.pollCount || 0 }}
                    />
                    <div className="text-xs text-muted-foreground">
                      Debug: hasData={String(dataAvailability.hasData)}, pollCount={dataAvailability.pollCount}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refetchDataAvailability()}
                      className="mt-2"
                    >
                      Refresh Data Check
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </CollapsibleContent>
          )}
        </Collapsible>
      </AISuggestionsErrorBoundary>
    );
  }

  // Show error if data availability check failed, but still show the panel
  if (!dataAvailability) {
    return (
      <AISuggestionsErrorBoundary onRetry={refetch}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="secondary"
              className="w-full justify-between border-t"
              type="button"
            >
              <span className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-primary-500" />
                <Trans i18nKey="aiSuggestions" defaults="AI Time Suggestions" />
              </span>
              {isOpen ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          {isOpen && (
            <CollapsibleContent className="mt-3">
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  <Trans
                    i18nKey="aiDataCheckFailed"
                    defaults="Unable to check data availability. Please try again."
                  />
                  {refetch && (
                    <Button size="sm" variant="outline" onClick={() => refetch()} className="mt-2">
                      <Trans i18nKey="retry" defaults="Retry" />
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            </CollapsibleContent>
          )}
        </Collapsible>
      </AISuggestionsErrorBoundary>
    );
  }

  return (
    <AISuggestionsErrorBoundary onRetry={refetch}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="secondary"
            className="w-full justify-between border-t"
            type="button"
            aria-label={
              isOpen
                ? "Hide AI time suggestions"
                : "Show AI time suggestions"
            }
          >
            <span className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-primary-500" />
              <Trans
                i18nKey="aiSuggestions"
                defaults="AI Time Suggestions"
              />
              {suggestionsData?.suggestions && suggestionsData.suggestions.length > 0 && (
                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full font-medium">
                  {suggestionsData.suggestions.length}
                </span>
              )}
              {loadingSuggestions && (
                <Spinner className="size-4" />
              )}
            </span>
            {isOpen ? (
              <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          {selectedDates.length > 0 ? (
            <>
              <div className="mb-3 text-sm text-muted-foreground">
                <Trans
                  i18nKey="aiSuggestionsForSelectedDates"
                  defaults="Showing suggestions for {count} selected {count, plural, one {date} other {dates}}"
                  values={{
                    count: selectedDates.length,
                  }}
                />
              </div>
              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === "development" && (
                <div className="mb-2 text-xs text-muted-foreground p-2 bg-muted rounded">
                  <strong>Debug:</strong> Selected dates: {selectedDates.map(d => dayjs(d).format("YYYY-MM-DD")).join(", ")} | 
                  Query enabled: {String(enabled && isOpen && isUserReady && dataAvailability?.hasData === true && selectedDates.length > 0)} | 
                  Loading: {String(loadingSuggestions)} | 
                  Has suggestions: {String(!!suggestionsData?.suggestions)} | 
                  Suggestions count: {suggestionsData?.suggestions?.length || 0} | 
                  Filtered count: {filteredSuggestions.length}
                </div>
              )}
              {filteredSuggestions.length === 0 && 
               !loadingSuggestions && 
               !error && (
                <Alert className="mb-3">
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    {suggestionsData?.suggestions && suggestionsData.suggestions.length > 0 ? (
                      <>
                        <Trans
                          i18nKey="aiSuggestionsNoMatchesForSelectedDates"
                          defaults="No suggestions match your selected dates. Showing all available suggestions below."
                        />
                        <div className="mt-2 text-xs text-muted-foreground">
                          Selected dates: {selectedDates.map(d => dayjs(d).format("MMM D")).join(", ")}
                        </div>
                      </>
                    ) : (
                      <div>
                        <Trans
                          i18nKey="aiSuggestionsNoSuggestionsGenerated"
                          defaults="No suggestions were generated. Try adjusting your date range or duration."
                        />
                        {process.env.NODE_ENV === "development" && (
                          <div className="mt-2 text-xs">
                            Debug: Query enabled={String(enabled && isOpen && isUserReady && dataAvailability?.hasData === true && selectedDates.length > 0)}, 
                            Has data={String(dataAvailability?.hasData)}, 
                            Selected dates={selectedDates.length}
                          </div>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              <SuggestionsList
                suggestions={filteredSuggestions.length > 0 ? filteredSuggestions : (suggestionsData?.suggestions || [])}
                isLoading={loadingSuggestions}
                error={error}
                dataQuality={suggestionsData?.metadata.dataQuality}
                totalPollsAnalyzed={suggestionsData?.metadata.totalPollsAnalyzed}
                onApplySuggestion={handleApplySuggestion}
                onDismissSuggestion={handleDismissSuggestion}
                onRetry={() => refetch()}
              />
            </>
          ) : (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                <Trans
                  i18nKey="aiSuggestionsSelectDatesFirst"
                  defaults="Please select dates in the calendar above to see AI time suggestions for those dates."
                />
                {process.env.NODE_ENV === "development" && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Debug: Options count: {watchOptions?.length || 0}, Selected dates: {selectedDates.length}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CollapsibleContent>
      </Collapsible>
    </AISuggestionsErrorBoundary>
  );
}

