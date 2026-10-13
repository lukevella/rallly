"use client";

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

// Fallbacks can hand off across separate commits, so completion waits this
// long for another fallback to register before finishing the bar.
const HANDOFF_GRACE_MS = 100;
const HIDE_DELAY_MS = 500;

const toPercent = (value: number) =>
  Math.round((Math.atan(value) / (Math.PI / 2)) * 100);

export const RouterLoadingBar = () => {
  const isPending = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [isVisible, setIsVisible] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const currentProgress = React.useRef(0);
  const finishTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const hideTimeout = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!isPending) {
      return;
    }

    if (finishTimeout.current) {
      // A fallback handed off to the next one; keep the bar's position
      clearTimeout(finishTimeout.current);
      finishTimeout.current = null;
    } else {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = null;
      }
      currentProgress.current = 0;
      setProgress(0);
      setIsVisible(true);
    }

    const interval = setInterval(() => {
      // Use a smaller step for slower progress after 70%
      currentProgress.current +=
        toPercent(currentProgress.current) >= 70 ? 0.1 : 0.5;
      setProgress(toPercent(currentProgress.current));
    }, 100);

    return () => {
      clearInterval(interval);
      finishTimeout.current = setTimeout(() => {
        finishTimeout.current = null;
        setProgress(100);
        hideTimeout.current = setTimeout(() => {
          hideTimeout.current = null;
          setIsVisible(false);
          setProgress(0);
        }, HIDE_DELAY_MS);
      }, HANDOFF_GRACE_MS);
    };
  }, [isPending]);

  React.useEffect(() => {
    return () => {
      if (finishTimeout.current) clearTimeout(finishTimeout.current);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  // Decorative: pages announce loading through their own skeletons
  return (
    <div aria-hidden className="fixed top-0 right-0 left-0 z-50 w-full">
      <Progress value={progress} className="h-1 rounded-none" />
    </div>
  );
};
