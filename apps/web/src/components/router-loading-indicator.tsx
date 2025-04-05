"use client";

import { cn } from "@rallly/ui";
import { Progress } from "@rallly/ui/progress";
import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";

export const RouterLoadingIndicator = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const progressInterval = React.useRef<NodeJS.Timeout | null>(null);

  // Track route changes
  React.useEffect(() => {
    const startLoading = () => {
      setIsLoading(true);
      setProgress(90);

      // Simulate progress
      progressInterval.current = setInterval(() => {
        setProgress((prevProgress) => {
          // Slowly increase to 99%, then wait for actual completion
          if (prevProgress >= 99) {
            return 99;
          }
          return prevProgress + (99 - prevProgress) * 0.1;
        });
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
      }, 300);
    };

    startLoading();

    // When route changes complete, stop loading
    return () => {
      stopLoading();
    };
  }, [pathname, searchParams]);

  return (
    <div
      className={cn(
        "fixed left-0 right-0 top-0 z-50 w-full transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0",
      )}
    >
      <Progress value={progress} className="h-0.5 rounded-none" />
    </div>
  );
};
