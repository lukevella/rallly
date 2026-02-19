import { randomUUID } from "node:crypto";

/**
 * Wide Event structure for the "one event per request" logging pattern.
 * Include as many fields as relevant - more context means faster debugging.
 */
export interface WideEvent {
  // Request identification
  /**
   * The unique identifier for the request.
   */
  requestId?: string;
  /**
   * When the event occurred.
   */
  timestamp?: string;
  /**
   * The service that handled the request.
   */
  service: string;

  // Request details
  /**
   * The HTTP method of the request.
   */
  method?: string;
  /**
   * The path of the request.
   */
  path?: string;
  /**
   * The HTTP status code of the response.
   */
  statusCode?: number;
  /**
   * The IP address of the request.
   */
  ip?: string;
  /**
   * The JA4 digest of the request.
   */
  ja4Digest?: string;
  /**
   * The duration of the request in milliseconds.
   */
  durationMs?: number;

  // User context
  /**
   * The user ID of the user who made the request.
   */
  userId?: string;
  /**
   * Whether the user is a guest.
   */
  isGuest?: boolean;

  // Business context
  /**
   * The poll that was affected by the event.
   */
  pollId?: string;
  /**
   * The space that was affected by the event.
   */
  spaceId?: string;

  // Error details
  /**
   * The type of error that occurred.
   * eg. "TRPCError", "AppError", "ValidationError", etc.
   */
  errorType?: string;
  /**
   * The code of the error that occurred.
   * eg. "UNAUTHORIZED", "NOT_FOUND", "FORBIDDEN", "INTERNAL_SERVER_ERROR", etc.
   */
  errorCode?: string;
  /**
   * The message of the error that occurred.
   * eg. "The user is not authorized to access this resource", "The resource was not found", etc.
   */
  errorMessage?: string;
  isRetriable?: boolean;

  // Performance metrics
  dbQueryCount?: number;
  dbQueryDurationMs?: number;

  // Rate limiting
  rateLimiter?: string;
  rateLimiterRemainingPoints?: number;
  rateLimiterConsumedPoints?: number;

  // Allow additional fields
  [key: string]: unknown;
}

/**
 * Creates a new wide event context for a request.
 * Call this at the start of request handling.
 */
export function createWideEvent(event: WideEvent): WideEvent {
  return {
    requestId: event?.requestId ?? randomUUID(),
    timestamp: new Date().toISOString(),
    ...event,
  };
}
