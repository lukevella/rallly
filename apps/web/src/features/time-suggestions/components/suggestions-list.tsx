/**
 * Component for displaying a list of AI time suggestions
 */

"use client";

import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Card, CardContent } from "@rallly/ui/card";
import { Spinner } from "@/components/spinner";
import { AlertCircleIcon, SparklesIcon, InfoIcon } from "lucide-react";
import { Trans } from "@/components/trans";
import { SuggestionCard } from "./suggestion-card";
import type { TimeSuggestion } from "../types";

export interface SuggestionsListProps {
  suggestions: TimeSuggestion[];
  isLoading?: boolean;
  error?: Error | null;
  dataQuality?: "high" | "medium" | "low";
  totalPollsAnalyzed?: number;
  onApplySuggestion?: (suggestion: TimeSuggestion) => void;
  onDismissSuggestion?: (suggestion: TimeSuggestion) => void;
  onRetry?: () => void;
}

export function SuggestionsList({
  suggestions,
  isLoading,
  error,
  dataQuality,
  totalPollsAnalyzed,
  onApplySuggestion,
  onDismissSuggestion,
  onRetry,
}: SuggestionsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <Spinner />
            <p className="text-sm text-gray-500">
              <Trans
                i18nKey="analyzingPatterns"
                defaults="Analyzing historical patterns..."
              />
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertTitle>
          <Trans i18nKey="errorLoadingSuggestions" defaults="Error loading suggestions" />
        </AlertTitle>
        <AlertDescription>
          <p className="mb-2">{error.message}</p>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <Trans i18nKey="retry" defaults="Retry" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <InfoIcon className="h-8 w-8 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">
                <Trans
                  i18nKey="noSuggestionsAvailable"
                  defaults="No suggestions available"
                />
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {dataQuality === "low" && totalPollsAnalyzed !== undefined ? (
                  <Trans
                    i18nKey="insufficientData"
                    defaults="We need more historical data to provide suggestions. You have {{count}} poll{{plural}} in your history."
                    values={{
                      count: totalPollsAnalyzed,
                      plural: totalPollsAnalyzed !== 1 ? "s" : "",
                    }}
                  />
                ) : (
                  <Trans
                    i18nKey="noSuggestionsReason"
                    defaults="Try adjusting your date range or duration."
                  />
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {dataQuality && totalPollsAnalyzed !== undefined && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
          <SparklesIcon className="h-4 w-4 text-primary-500" />
          <span>
            <Trans
              i18nKey="suggestionsBasedOnData"
              defaults="Based on {{count}} historical poll{{plural}}"
              values={{
                count: totalPollsAnalyzed,
                plural: totalPollsAnalyzed !== 1 ? "s" : "",
              }}
            />
          </span>
          {dataQuality && (
            <Badge variant="outline" className="ml-2 text-xs">
              {dataQuality === "high" ? "High Quality" : dataQuality === "medium" ? "Medium Quality" : "Low Quality"}
            </Badge>
          )}
        </div>
      )}
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onApply={onApplySuggestion}
            onDismiss={onDismissSuggestion}
          />
        ))}
      </div>
    </div>
  );
}

