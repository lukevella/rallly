"use client";

import { safeSessionStorage } from "@rallly/utils/safe-session-storage";
import React from "react";

import { trackPollView } from "@/actions/track-poll-view";

// Global tracking state to prevent duplicate tracking across re-renders and strict mode
const trackedPolls = new Set<string>();

// Time to wait before recording a view (in milliseconds)
const VIEW_DELAY = 5000; // 5 seconds

/**
 * Component that tracks poll views
 * This should be included in poll pages to automatically record views
 */
export function PollViewTracker({ pollId }: { pollId: string }) {
  React.useEffect(() => {
    // Only track views in the browser
    if (typeof window === "undefined") return;

    // Check if this poll has already been tracked in this session
    if (trackedPolls.has(pollId)) {
      return;
    }

    // Mark as tracked immediately to prevent duplicate tracking
    trackedPolls.add(pollId);

    // Avoid duplicate view tracking within the same browser session
    const viewKey = `poll-view-${pollId}`;
    const lastView = safeSessionStorage.getStorage(viewKey);
    const now = Date.now();

    // Only track a view if it's been more than 30 minutes since the last view
    // or if this is the first view in this session
    if (!lastView || now - parseInt(lastView) > 30 * 60 * 1000) {
      // Set a timeout to wait before recording the view
      // This ensures we only track meaningful visits, not accidental or brief page loads
      const timeoutId = setTimeout(async () => {
        // Record the view using server action
        await trackPollView(pollId);

        // Update the last view timestamp
        safeSessionStorage.setStorage(viewKey, now.toString());
      }, VIEW_DELAY);

      // Clean up the timeout if the component unmounts before the delay completes
      return () => clearTimeout(timeoutId);
    }
  }, [pollId]);

  // This component doesn't render anything
  return null;
}
