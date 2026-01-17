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
  is_guest: boolean;
  created_at: string;
  participant_count: number;
  hide_participants: boolean;
  require_participant_email: boolean;
  hide_scores: boolean;
  disable_comments: boolean;
  comment_count: number;
  option_count: number;
  has_location: boolean;
  has_description: boolean;
  timezone?: string;
}

// Discriminated union of all possible poll events
export type PollEvent =
  | PollCreateEvent
  | PollUpdateDetailsEvent
  | PollUpdateOptionsEvent
  | PollUpdateSettingsEvent
  | PollDeleteEvent
  | PollScheduleEvent
  | PollReopenEvent
  | PollCloseEvent
  | PollWatchEvent
  | PollUnwatchEvent
  | PollResponseSubmitEvent
  | PollResponseUpdateEvent
  | PollResponseDeleteEvent
  | PollCommentAddEvent
  | PollCommentDeleteEvent
  | PollErrorEvent;

// Poll events
export interface PollCreateEvent extends BaseEventData {
  type: "poll_create";
  spaceId?: string;
  properties: {
    title: string;
    optionCount: number;
    hasLocation: boolean;
    hasDescription: boolean;
    timezone?: string;
    disableCommnets: boolean;
    hideScores: boolean;
    hideParticipants: boolean;
    requireParticipantEmail: boolean;
    isGuest: boolean;
  };
}

export interface PollUpdateDetailsEvent extends BaseEventData {
  type: "poll_update_details";
  properties: {
    title: string;
    hasDescription: boolean;
    hasLocation: boolean;
    isGuest: boolean;
  };
}

export interface PollUpdateOptionsEvent extends BaseEventData {
  type: "poll_update_options";
  properties: {
    optionCount: number;
    isGuest: boolean;
  };
}

export interface PollUpdateSettingsEvent extends BaseEventData {
  type: "poll_update_settings";
  properties: {
    hideScores: boolean;
    hideParticipants: boolean;
    disableComments: boolean;
    requireParticipantEmail: boolean;
    isGuest: boolean;
  };
}

export interface PollDeleteEvent extends BaseEventData {
  type: "poll_delete";
  properties?: {
    isGuest: boolean;
  };
}

export interface PollScheduleEvent extends BaseEventData {
  type: "poll_schedule";
  properties: {
    participantCount: number;
    attendeeCount: number;
    daysSinceCreated: number;
  };
}

export interface PollReopenEvent extends BaseEventData {
  type: "poll_reopen";
}

export interface PollCloseEvent extends BaseEventData {
  type: "poll_close";
  properties?: {
    isGuest: boolean;
  };
}

export interface PollWatchEvent extends BaseEventData {
  type: "poll_watch";
}

export interface PollUnwatchEvent extends BaseEventData {
  type: "poll_unwatch";
}

export interface PollResponseSubmitEvent extends BaseEventData {
  type: "poll_response_submit";
  properties: {
    participantId: string;
    hasEmail: boolean;
    totalResponses: number;
    isCreator: boolean;
    isGuest: boolean;
  };
}

export interface PollResponseUpdateEvent extends BaseEventData {
  type: "poll_response_update";
  properties: {
    participantId: string;
  };
}

export interface PollResponseDeleteEvent extends BaseEventData {
  type: "poll_response_delete";
  properties: {
    participantId: string;
  };
}

// Poll comment events
export interface PollCommentAddEvent extends BaseEventData {
  type: "poll_comment_add";
  properties: {
    commentId: string;
    isGuest: boolean;
  };
}

export interface PollCommentDeleteEvent extends BaseEventData {
  type: "poll_comment_delete";
  properties: {
    commentId: string;
  };
}

// Error events
export interface PollErrorEvent extends BaseEventData {
  type: "poll_error";
  properties: {
    operation: string;
    errorMessage: string;
    errorCode?: string;
    errorStatus?: number;
  };
}
