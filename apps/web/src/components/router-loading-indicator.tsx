"use client";

import { cn } from "@rallly/ui";
import { Progress } from "@rallly/ui/progress";
import * as React from "react";

export const RouterLoadingIndicator = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const progressInterval = React.useRef<NodeJS.Timeout | null>(null);
  const currentProgress = React.useRef(0);

  // Track route changes
  React.useEffect(() => {
    const startLoading = () => {
      setIsLoading(true);
      setProgress(0);
      currentProgress.current = 0;

      // Use a smaller step for slower progress initially
      let step = 0.5;

      progressInterval.current = setInterval(() => {
        currentProgress.current += step;

        const calculatedProgress = Math.round(
          (Math.atan(currentProgress.current) / (Math.PI / 2)) * 100,
        );

        setProgress(calculatedProgress);

        if (calculatedProgress >= 70) {
          step = 0.1;
        }
      }, 100);
    };

    const stopLoading = () => {
      setProgress(100);

      // Clear the interval
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      // Reset after animation completes
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500);
    };

    startLoading();

    // When route changes complete, stop loading
    return () => {
      stopLoading();
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed top-0 right-0 left-0 z-50 w-full",
        isLoading ? "opacity-100" : "opacity-0",
      )}
    >
      <Progress value={progress} className="h-1 rounded-none" />
    </div>
  );
};
