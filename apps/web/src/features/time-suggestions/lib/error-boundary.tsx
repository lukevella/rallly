/**
 * Error boundary for AI suggestions feature
 * Gracefully handles errors and prevents UI crashes
 */

"use client";

import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { AlertCircleIcon } from "lucide-react";
import React from "react";
import { Trans } from "@/components/trans";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class AISuggestionsErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AI Suggestions Error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>
            <Trans
              i18nKey="suggestionsError"
              defaults="Error loading suggestions"
            />
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              <Trans
                i18nKey="suggestionsErrorDescription"
                defaults="Something went wrong while loading AI suggestions. You can still create your poll manually."
              />
            </p>
            <Button size="sm" variant="outline" onClick={this.handleReset}>
              <Trans i18nKey="tryAgain" defaults="Try Again" />
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}


