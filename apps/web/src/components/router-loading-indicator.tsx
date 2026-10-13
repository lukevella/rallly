"use client";

import { cn } from "@rallly/ui";
import { Progress } from "@rallly/ui/progress";
import * as React from "react";

// Nested Suspense fallbacks resolve one after another during a navigation.
// Each fallback registers here instead of drawing its own bar, so the single
// bar keeps moving until the last boundary resolves.
let pendingCount = 0;
const listeners = new Set<() => void>();

function setPendingCount(next: number) {
  pendingCount = next;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => pendingCount > 0;
const getServerSnapshot = () => false;

export const RouterLoadingIndicator = () => {
  React.useEffect(() => {
    setPendingCount(pendingCount + 1);
    return () => {
      setPendingCount(pendingCount - 1);
    };
  }, []);

  return null;
};

export const RouterLoadingBar = () => {
  const isPending = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [isVisible, setIsVisible] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const hideTimeout = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!isPending) {
      return;
    }

    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }

    setIsVisible(true);
    setProgress(0);

    // Use a smaller step for slower progress initially
    let step = 0.5;
    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += step;

      const calculatedProgress = Math.round(
        (Math.atan(currentProgress) / (Math.PI / 2)) * 100,
      );

      setProgress(calculatedProgress);

      if (calculatedProgress >= 70) {
        step = 0.1;
      }
    }, 100);

    return () => {
      clearInterval(interval);
      setProgress(100);
      hideTimeout.current = setTimeout(() => {
        hideTimeout.current = null;
        setIsVisible(false);
        setProgress(0);
      }, 500);
    };
  }, [isPending]);

  return (
    <div
      className={cn(
        "fixed top-0 right-0 left-0 z-50 w-full",
        isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      <Progress value={progress} className="h-1 rounded-none" />
    </div>
  );
};
