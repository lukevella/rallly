/**
 * Component for displaying a single time suggestion
 */

"use client";

import { Button } from "@rallly/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rallly/ui/card";
import { Badge } from "@rallly/ui/badge";
import { ClockIcon, SparklesIcon, TrendingUpIcon } from "lucide-react";
import dayjs from "dayjs";
import { Trans } from "@/components/trans";
import type { TimeSuggestion } from "../types";

export interface SuggestionCardProps {
  suggestion: TimeSuggestion;
  onApply?: (suggestion: TimeSuggestion) => void;
  onDismiss?: (suggestion: TimeSuggestion) => void;
  timezone?: string;
}

export function SuggestionCard({
  suggestion,
  onApply,
  onDismiss,
  timezone,
}: SuggestionCardProps) {
  const startTime = dayjs(suggestion.startTime);
  const endTime = dayjs(suggestion.endTime);
  const duration = endTime.diff(startTime, "minute");

  const formatTime = (date: Date) => {
    return dayjs(date).format("ddd, MMM D [at] h:mm A");
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-50 text-green-700 border-green-200";
    if (confidence >= 60) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return "High";
    if (confidence >= 60) return "Medium";
    return "Low";
  };

  return (
    <Card className="border-l-4 border-l-primary-500 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-primary-500 flex-shrink-0" />
              <span className="truncate">{formatTime(suggestion.startTime)}</span>
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              <Trans
                i18nKey="duration"
                defaults="Duration: {{duration}} minutes"
                values={{ duration }}
              />
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`${getConfidenceColor(suggestion.confidence)} text-xs font-medium border`}
          >
            {getConfidenceLabel(suggestion.confidence)} ({suggestion.confidence}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {suggestion.reasoning && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {suggestion.reasoning}
          </p>
        )}

        {suggestion.sourceData.patternMatches.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestion.sourceData.patternMatches.map((match, index) => (
              <Badge key={index} variant="secondary" className="text-xs font-normal">
                <TrendingUpIcon className="h-3 w-3 mr-1" />
                {match}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
          <TrendingUpIcon className="h-3 w-3" />
          <span>
            <Trans
              i18nKey="basedOnData"
              defaults="Based on {{polls}} polls with {{participants}} participants"
              values={{
                polls: suggestion.sourceData.similarPolls,
                participants: suggestion.sourceData.participantMatches,
              }}
            />
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          {onApply && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onApply(suggestion)}
              className="flex-1"
            >
              <Trans i18nKey="applySuggestion" defaults="Use this time" />
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDismiss(suggestion)}
            >
              <Trans i18nKey="dismiss" defaults="Dismiss" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

