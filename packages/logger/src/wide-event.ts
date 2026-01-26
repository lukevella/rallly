import { randomUUID } from "node:crypto";

/**
 * Wide Event structure for the "one event per request" logging pattern.
 * Include as many fields as relevant - more context means faster debugging.
 */
export interface WideEvent {
  // Request identification
  requestId: string;
  timestamp: string;
  service: string;

  // Request details
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;

  // User context
  userId?: string;
  isGuest?: boolean;
  subscriptionTier?: string;

  // Business context
  pollId?: string;
  spaceId?: string;

  // Error details
  /**
   * The type of error that occurred.
   */
  errorType?: string;
  /**
   * The HTTP status code of the error.
   */
  errorCode?: string;
  errorMessage?: string;
  isRetriable?: boolean;

  // Performance metrics
  dbQueryCount?: number;
  dbQueryDurationMs?: number;

  // Allow additional fields
  [key: string]: unknown;
}

/**
 * Creates a new wide event context for a request.
 * Call this at the start of request handling.
 */
export function createWideEvent(options: {
  service: string;
  requestId?: string;
}): WideEvent {
  return {
    requestId: options.requestId ?? randomUUID(),
    timestamp: new Date().toISOString(),
    service: options.service,
  };
}
