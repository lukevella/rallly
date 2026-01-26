# Logging Guidelines

This project follows the **Wide Events** pattern. Logs are optimized for querying, not writing.

## Core Principle

Emit **one comprehensive event per request per service** containing all contextual information. Do not scatter log statements throughout your code.

**Wrong mental model:** Log what your code is doing
**Correct mental model:** Log what happened to this request

## Wide Event Structure

Each event should include:

```typescript
{
  // Request metadata
  requestId: string,
  traceId: string,
  timestamp: Date,
  service: string,

  // HTTP details
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,

  // User context
  userId?: string,
  subscriptionTier?: string,

  // Business context
  pollId?: string,
  spaceId?: string,
  featureFlags: Record<string, boolean>,

  // Error details (when applicable)
  errorType?: string,
  errorCode?: string,
  errorMessage?: string,
  isRetriable?: boolean,

  // Performance metrics
  dbQueryCount?: number,
  dbQueryDurationMs?: number
}
```

## Implementation Pattern

Use middleware to build the event throughout the request lifecycle:

1. Initialize event at request start with request/service metadata
2. Enrich with user context after authentication
3. Add business context as processing occurs
4. Emit single event in finally block after request completes

## Anti-Patterns

**Never do these:**

- Scattered `console.log` statements throughout code
- String-based log messages without structured data
- Low-context logs with only timestamp, level, and message
- Multiple log lines for a single request

**Example of what NOT to do:**

```typescript
// BAD - scattered, low-context logs
console.log("Starting request");
console.log("User authenticated");
console.log("Fetching poll");
console.log("Request complete");
```

**Example of correct approach:**

```typescript
// GOOD - single wide event with full context
logger.info({
  requestId: ctx.requestId,
  userId: ctx.user?.id,
  pollId: params.pollId,
  method: "GET",
  path: "/api/polls/:id",
  statusCode: 200,
  durationMs: 45,
  dbQueryCount: 2,
  dbQueryDurationMs: 12
});
```

## Tail Sampling

When implementing log sampling, make decisions **after** request completion:

**Always capture 100%:**
- All errors (5xx status, exceptions)
- Requests exceeding p99 latency
- Pro/enterprise user requests
- Requests with feature flags under rollout

**Sample remaining traffic:** 1-5% of successful, fast requests

## High-Cardinality Data

Include high-cardinality fields (userId, pollId, requestId). Modern observability tools handle this efficiently. High-cardinality data enables queries like:

> "Show me all poll creation failures for pro users in the last hour where the quick-create feature flag was enabled, grouped by error code"

## Field Guidelines

Aim for 50+ fields per event. More context means faster debugging. Include:

- All IDs involved in the request
- All feature flags evaluated
- All external service calls made
- Timing breakdown for significant operations
- User tier and account metadata
