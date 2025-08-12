import type { PollStatus } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import { convertKeysToSnakeCase } from "@rallly/utils/string-utils";

/**
 * Poll analytics functions using functional approach
 * Single trackPollEvent function with type-safe event objects
 *
 * Note: Functions are async for consistency and to allow for future async operations,
 * but PostHog calls are synchronous (events are batched and sent when shutdown() is called)
 *
 * PostHog automatically tracks timestamps for events, so we don't need to pass them
 */

// Base event data that all events share
interface BaseEventData {
  userId: string;
  pollId: string;
}

// Poll group properties for PostHog groups
export interface PollGroupProperties {
  title: string;
  status: PollStatus;
  created_at: string;
  participant_count: number;
  comment_count: number;
  option_count: number;
  has_location: boolean;
  has_description: boolean;
  timezone?: string;
}

// Discriminated union of all possible poll events
export type PollEvent =
  | PollCreatedEvent
  | PollUpdatedEvent
  | PollDeletedEvent
  | PollFinalizedEvent
  | PollReopenedEvent
  | PollPausedEvent
  | PollResumedEvent
  | PollWatchedEvent
  | PollUnwatchedEvent
  | ParticipantAddedEvent
  | ParticipantUpdatedEvent
  | ParticipantDeletedEvent
  | CommentAddedEvent
  | CommentDeletedEvent
  | PollErrorEvent;

// Poll events
export interface PollCreatedEvent extends BaseEventData {
  type: "poll_created";
  properties: {
    title: string;
    optionCount: number;
    hasLocation: boolean;
    hasDescription: boolean;
    timezone?: string;
  };
}

export interface PollUpdatedEvent extends BaseEventData {
  type: "poll_updated";
  properties: {
    fieldsUpdated: string[];
  };
}

export interface PollDeletedEvent extends BaseEventData {
  type: "poll_deleted";
  properties?: Record<string, never>; // No additional properties
}

export interface PollFinalizedEvent extends BaseEventData {
  type: "poll_finalized";
  properties: {
    participantCount: number;
    attendeeCount: number;
    daysSinceCreated: number;
  };
}

export interface PollReopenedEvent extends BaseEventData {
  type: "poll_reopened";
  properties?: Record<string, never>; // No additional properties
}

export interface PollPausedEvent extends BaseEventData {
  type: "poll_paused";
  properties?: Record<string, never>; // No additional properties
}

export interface PollResumedEvent extends BaseEventData {
  type: "poll_resumed";
  properties?: Record<string, never>; // No additional properties
}

export interface PollWatchedEvent extends BaseEventData {
  type: "poll_watched";
  properties?: Record<string, never>; // No additional properties
}

export interface PollUnwatchedEvent extends BaseEventData {
  type: "poll_unwatched";
  properties?: Record<string, never>; // No additional properties
}

// Participant events
export interface ParticipantAddedEvent extends BaseEventData {
  type: "participant_added";
  properties: {
    participantId: string;
    participantName: string;
    hasEmail: boolean;
    voteCount: number;
  };
}

export interface ParticipantUpdatedEvent extends BaseEventData {
  type: "participant_updated";
  properties: {
    participantId: string;
    voteCount: number;
  };
}

export interface ParticipantDeletedEvent extends BaseEventData {
  type: "participant_deleted";
  properties: {
    participantId: string;
  };
}

// Comment events
export interface CommentAddedEvent extends BaseEventData {
  type: "comment_added";
  properties: {
    commentId: string;
    authorName: string;
    contentLength: number;
  };
}

export interface CommentDeletedEvent extends BaseEventData {
  type: "comment_deleted";
  properties: {
    commentId: string;
  };
}

// Error events
export interface PollErrorEvent extends BaseEventData {
  type: "poll_operation_error";
  properties: {
    operation: string;
    errorMessage: string;
    errorCode?: string;
    errorStatus?: number;
  };
}

/**
 * Main analytics tracking function using discriminated union
 */
export function trackPollEvent(event: PollEvent): void {
  if (!posthog) return;

  // Handle special case for poll creation - also set up group
  if (event.type === "poll_created") {
    posthog.groupIdentify({
      groupType: "poll",
      groupKey: event.pollId,
      properties: {
        name: event.properties.title, // The PostHog UI identifies a group using the name property
        status: "live", // New polls start as live
        participant_count: 0, // New polls start with 0 participants
        comment_count: 0, // New polls start with 0 comments
        option_count: event.properties.optionCount,
        has_location: event.properties.hasLocation,
        has_description: event.properties.hasDescription,
        timezone: event.properties.timezone,
      },
    });
  }

  // Track the event - convert camelCase properties to snake_case
  const properties = convertKeysToSnakeCase(event.properties || {});

  posthog.capture({
    distinctId: event.userId,
    event: event.type,
    properties: {
      poll_id: event.pollId,
      ...properties,
    },
    groups: {
      poll: event.pollId,
    },
  });
}

/**
 * Poll group management
 * Note: trackPollEvent with type 'poll_created' automatically sets up initial group properties
 * Use this function to update group properties after poll creation (e.g., when participant/comment counts change)
 */
export async function updatePollGroup(
  pollId: string,
  properties: PollGroupProperties,
): Promise<void> {
  if (!posthog) return;

  try {
    posthog.groupIdentify({
      groupType: "poll",
      groupKey: pollId,
      properties,
    });
  } catch (error) {
    console.error("Failed to update poll group:", error);
  }
}
