import type { PollStatus } from "@/features/poll/schema";

// Base event data that all events share
interface BaseEventData {
  userId: string;
  pollId: string;
  properties?: Record<string, unknown>;
}

export interface PollGroupProperties {
  name: string; // PostHog group name (same as title)
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
  | PollUpdatedDetailsEvent
  | PollUpdatedOptionsEvent
  | PollUpdatedSettingsEvent
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

export interface PollUpdatedDetailsEvent extends BaseEventData {
  type: "poll_updated_details";
  properties: {
    title?: string;
    hasDescription?: boolean;
    hasLocation?: boolean;
  };
}

export interface PollUpdatedOptionsEvent extends BaseEventData {
  type: "poll_updated_options";
  properties: {
    optionCount?: number;
  };
}

export interface PollUpdatedSettingsEvent extends BaseEventData {
  type: "poll_updated_settings";
  properties: {
    timezone?: string;
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
}

export interface PollPausedEvent extends BaseEventData {
  type: "poll_paused";
}

export interface PollResumedEvent extends BaseEventData {
  type: "poll_resumed";
}

export interface PollWatchedEvent extends BaseEventData {
  type: "poll_watched";
}

export interface PollUnwatchedEvent extends BaseEventData {
  type: "poll_unwatched";
}

// Participant events
export interface ParticipantAddedEvent extends BaseEventData {
  type: "participant_added";
  properties: {
    participantId: string;
    hasEmail: boolean;
  };
}

export interface ParticipantUpdatedEvent extends BaseEventData {
  type: "participant_updated";
  properties: {
    participantId: string;
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
