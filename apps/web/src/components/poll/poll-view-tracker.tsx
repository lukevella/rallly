"use client";

import { safeSessionStorage } from "@rallly/utils/safe-session-storage";
import { useDebounce } from "react-use";

import { trackPollView } from "@/actions/track-poll-view";

// Global tracking state to prevent duplicate tracking across re-renders and strict mode
const trackedPolls = new Set<string>();

const VIEW_DELAY = 5000;

/**
 * Component that tracks poll views
 * This should be included in poll pages to automatically record views
 */
export function PollViewTracker({ pollId }: { pollId: string }) {
  // Use debounce to handle the view tracking
  // This will only execute after VIEW_DELAY milliseconds
  // and will automatically handle cleanup if the component unmounts
  useDebounce(
    () => {
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
        // Record the view using server action
        trackPollView(pollId).then(() => {
          // Update the last view timestamp
          safeSessionStorage.setStorage(viewKey, now.toString());
        });
      }
    },
    VIEW_DELAY,
    [pollId],
  );

  // This component doesn't render anything
  return null;
}
