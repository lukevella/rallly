import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  describeRoute,
  generateSpecs,
  loadVendor,
  resolver,
  validator,
} from "hono-openapi";
import { after } from "next/server";
import { MAX_POLL_OPTIONS } from "@/features/poll/constants";
import {
  getPollParticipants,
  getPollResults,
  getPollWithOptions,
  listPolls,
} from "@/features/poll/data";
import { closePoll, createPoll, deletePoll } from "@/features/poll/mutations";
import { getSpaceMemberByEmail } from "@/features/space/member/data";
import type { SpaceTier } from "@/features/space/schema";
import type { AuthorizedSpaceId } from "@/features/space/types";
import type { SlotGeneratorInput } from "@/lib/datetime/slot-generator";
import {
  dedupeTimeSlots,
  generateTimeSlots,
  parseStartTime,
} from "@/lib/datetime/slot-generator";
import { isMaintenanceModeEnabled } from "@/lib/maintenance";
import { flushPostHog, identifyGroup, track } from "@/lib/posthog";
import { apiError, validationHook } from "../../middleware/api-error";
import { spaceApiKeyAuth } from "../../middleware/api-key";
import { toOpenApiSchema } from "../../middleware/openapi";
import {
  RATE_LIMIT_PER_DAY,
  RATE_LIMIT_PER_MINUTE,
  rateLimit,
} from "../../middleware/rate-limit";
import { wideEvent } from "../../middleware/wide-event";
import {
  createPollRequestExamples,
  patchPollRequestExamples,
} from "../examples";
import {
  createPollInputSchema,
  deletePollSuccessResponseSchema,
  errorResponseSchema,
  getPollParticipantsSuccessResponseSchema,
  getPollResultsSuccessResponseSchema,
  listParticipantsQuerySchema,
  listPollsQuerySchema,
  listPollsSuccessResponseSchema,
  patchPollInputSchema,
  pollResponseSchema,
} from "../schemas";

type Env = {
  Variables: {
    apiAuth: {
      spaceId: AuthorizedSpaceId;
      spaceOwnerId: string;
      spaceTier: SpaceTier;
      apiKeyId: string;
    };
  };
};

// The public URL has no `/api` prefix (https://api.rallly.co/v1/...), which
// is also what a standalone API deployment would serve, so Hono mounts at
// `/v1`. See `handler` below for how the app host's `/api/v1` reaches it.
const app = new Hono<Env>().basePath("/v1");

// Process-wide: hono-openapi keys converters by schema vendor, and every zod
// schema reports "zod". Schemas without native `.meta()` ids convert exactly as
// before, so the frozen /api/private route is unaffected.
loadVendor("zod", { toOpenAPISchema: toOpenApiSchema });

type PollKind = "date" | "time";

// All-day options are stored as UTC midnight of the calendar date, so the
// date is the first ten characters of the ISO string.
function toOptionResponse(
  kind: PollKind,
  option: { id: string; startTime: Date; duration: number },
) {
  if (kind === "date") {
    return {
      id: option.id,
      date: option.startTime.toISOString().slice(0, 10),
    };
  }
  return {
    id: option.id,
    startTime: option.startTime.toISOString(),
    duration: option.duration,
  };
}

function toPollResponseBody(poll: {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  timeZone: string | null;
  status: string;
  kind: PollKind;
  createdAt: Date;
  updatedAt: Date;
  requireParticipantEmail: boolean;
  hideParticipants: boolean;
  hideScores: boolean;
  disableComments: boolean;
  allowTentativeVotes: boolean;
  participantCount: number;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  options: { id: string; startTime: Date; duration: number }[];
}) {
  return {
    data: {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      location: poll.location,
      timeZone: poll.timeZone,
      status: poll.status,
      kind: poll.kind,
      createdAt: poll.createdAt.toISOString(),
      updatedAt: poll.updatedAt.toISOString(),
      organizer: poll.user
        ? {
            id: poll.user.id,
            name: poll.user.name,
            email: poll.user.email,
            image: poll.user.image,
          }
        : null,
      requireEmail: poll.requireParticipantEmail,
      hideParticipants: poll.hideParticipants,
      hideScores: poll.hideScores,
      disableComments: poll.disableComments,
      allowTentativeVotes: poll.allowTentativeVotes,
      participantCount: poll.participantCount,
      options: poll.options.map((option) =>
        toOptionResponse(poll.kind, option),
      ),
      adminUrl: absoluteUrl(`/poll/${poll.id}`),
      inviteUrl: shortUrl(`/invite/${poll.id}`),
    },
  };
}

app.use("*", wideEvent({ service: "api-v1" }));

// Every response except the public spec is scoped to an API key, so nothing
// in between may store it.
app.use("/polls/*", async (c, next) => {
  await next();
  c.res.headers.set("Cache-Control", "no-store");
});
app.use("/polls", async (c, next) => {
  await next();
  c.res.headers.set("Cache-Control", "no-store");
});

app.use("*", async (c, next) => {
  if (isMaintenanceModeEnabled()) {
    return c.json(
      apiError("SERVICE_UNAVAILABLE", "The app is down for maintenance"),
      503,
      { "Retry-After": "300" },
    );
  }
  await next();
});

app.notFound((c) =>
  c.json(
    apiError("NOT_FOUND", `No route matches ${c.req.method} ${c.req.path}.`),
    404,
  ),
);

// The wide event middleware reads `c.error`, which hono sets before calling
// this handler, so the original error is logged there. The client only ever
// sees a generic message.
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    // Bearer auth throws with a prebuilt JSON response.
    if (error.res) {
      return error.getResponse();
    }
    // hono's validator throws a bare 400 for a body it cannot parse.
    if (error.status === 400) {
      return c.json(apiError("VALIDATION_ERROR", error.message), 400);
    }
  }
  return c.json(
    apiError("INTERNAL_ERROR", "Something went wrong. Try again later."),
    500,
  );
});

const unauthorizedResponse = {
  description:
    "The API key is missing, invalid, expired or revoked. Includes a `WWW-Authenticate` header.",
  headers: {
    "WWW-Authenticate": {
      description: "The bearer challenge, per RFC 6750.",
      schema: { type: "string" as const },
    },
  },
  content: {
    "application/json": {
      schema: resolver(errorResponseSchema),
    },
  },
};

const spaceNotProResponse = {
  description:
    "The space associated with the API key does not have a Pro subscription",
  content: {
    "application/json": {
      schema: resolver(errorResponseSchema),
    },
  },
};

const retryAfterHeader = {
  "Retry-After": {
    description: "Seconds to wait before retrying the request.",
    schema: { type: "integer" as const },
  },
};

const rateLimitExceededResponse = {
  description:
    "Rate limit exceeded. Includes a `Retry-After` header indicating how many seconds to wait before retrying.",
  headers: retryAfterHeader,
  content: {
    "application/json": {
      schema: resolver(errorResponseSchema),
    },
  },
};

const serviceUnavailableResponse = {
  description:
    "The API is temporarily unavailable, for maintenance or because the rate limit store cannot be reached. Includes a `Retry-After` header. Maintenance responses are sent before the rate limiter runs and carry no `RateLimit-*` headers.",
  headers: retryAfterHeader,
  content: {
    "application/json": {
      schema: resolver(errorResponseSchema),
    },
  },
};

async function buildOpenApiSpec() {
  const spec = await generateSpecs(app, {
    documentation: {
      info: {
        title: "Rallly API",
        version: "1.0.0",
        description: [
          "## Versioning",
          "",
          "`v1` is stable. Additive changes (new endpoints, new optional fields) may land on this path at any time; breaking changes only arrive under a new version prefix.",
          "",
          "## Rate limits",
          "",
          `All endpoints share two limits per space: **${RATE_LIMIT_PER_MINUTE} requests per minute** and **${RATE_LIMIT_PER_DAY} requests per day**. Both are fixed windows that open with the first request and reset when they expire. Both limits are per space, not per API key, so creating additional keys does not increase throughput.`,
          "",
          "Every response from an authenticated request includes the standard `RateLimit-*` headers. Responses sent before the limiter runs (`401`, `403`, and the maintenance `503`) do not. `RateLimit-Policy` lists both limits; `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` describe whichever limit is closest to being exhausted. When either limit is exceeded the API responds with `429 Too Many Requests`, a `RATE_LIMIT_EXCEEDED` error body, and a `Retry-After` header indicating how many seconds to wait before retrying.",
          "",
          "If the rate limit store cannot be reached the API fails closed and responds with `503 Service Unavailable`, a `SERVICE_UNAVAILABLE` error body, and a `Retry-After` header.",
          "",
          "## Dates and times",
          "",
          "Every poll has a `kind`. A `date` poll offers calendar days: each option carries a `date` in `YYYY-MM-DD` format, which is a floating date with no time component and no timezone, so never convert it through a timezone. A `time` poll offers time slots: each option carries a `startTime` as an ISO 8601 instant in UTC and a `duration` in minutes; convert `startTime` into the poll's `timeZone` (or the viewer's) for display. Timestamps such as `createdAt` and `updatedAt` are always ISO 8601 instants in UTC.",
          "",
          "## Request bodies",
          "",
          "Request bodies are validated strictly: a field that is not part of the documented schema is rejected with `VALIDATION_ERROR` rather than ignored, so a misspelt setting never silently falls back to its default.",
          "",
          "## Enums",
          "",
          "Vote types are an open set. The built-in values are `yes`, `ifNeedBe` and `no`; new types may be added without a version change, so clients must tolerate values they do not recognise. `status` and `kind` are closed sets.",
          "",
          "## Lists",
          "",
          "Every list endpoint returns the items in `data` and a `nextCursor` beside it. Pass `nextCursor` as the `cursor` query parameter to fetch the next page; it is `null` on the last page.",
          "",
          "## Errors",
          "",
          'Every failure is `application/json` with the shape `{ "error": { "code", "message" } }`. `code` is stable and safe to branch on; `message` is human-readable and may change. `VALIDATION_ERROR` messages name each offending field.',
          "",
          "| Status | Code | When |",
          "| --- | --- | --- |",
          "| 400 | `VALIDATION_ERROR` | The body or query string did not match the schema, contained an unknown field, or the body was not valid JSON |",
          "| 400 | `INVALID_AUTHORIZATION_HEADER` | The `Authorization` header is not `Bearer <key>` |",
          "| 400 | `ORGANIZER_NOT_MEMBER` | The organizer email is not a member of the space |",
          "| 400 | `TOO_MANY_OPTIONS` | More than the maximum number of poll options |",
          "| 401 | `UNAUTHORIZED` | The API key is missing, invalid, expired or revoked |",
          "| 403 | `SPACE_NOT_PRO` | The space behind the key has no Pro subscription |",
          "| 404 | `NOT_FOUND` | No route matches the method and path |",
          "| 404 | `POLL_NOT_FOUND` | The poll does not exist or belongs to another space |",
          "| 422 | `TRANSITION_NOT_AVAILABLE` | The requested status change is not supported |",
          "| 429 | `RATE_LIMIT_EXCEEDED` | A rate limit window is exhausted |",
          "| 503 | `SERVICE_UNAVAILABLE` | Maintenance, or the rate limit store cannot be reached |",
          "| 500 | `INTERNAL_ERROR` | Unexpected failure; the request id is logged |",
        ].join("\n"),
      },
      // The public host serves `/v1/...` directly; without one the API is
      // reachable under the app's `/api` prefix. Read from process.env like
      // lib/maintenance.ts: `@/env` validates eagerly on import.
      servers: [{ url: process.env.API_BASE_URL ?? absoluteUrl("/api") }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
          },
        },
      },
    },
  });

  // hono-openapi's validator middleware owns the request body schema and
  // overwrites any content set via describeRoute, so named examples have to
  // be attached to the generated spec instead.
  const createPollRequestBody = spec.paths["/v1/polls"]?.post?.requestBody;
  if (createPollRequestBody && "content" in createPollRequestBody) {
    const media = createPollRequestBody.content?.["application/json"];
    if (media) {
      media.examples = createPollRequestExamples;
    }
  }

  const patchPollRequestBody =
    spec.paths["/v1/polls/{pollId}"]?.patch?.requestBody;
  if (patchPollRequestBody && "content" in patchPollRequestBody) {
    const media = patchPollRequestBody.content?.["application/json"];
    if (media) {
      media.examples = patchPollRequestExamples;
    }
  }

  return spec;
}

let openApiSpec: Awaited<ReturnType<typeof buildOpenApiSpec>> | undefined;

app.get("/openapi", async (c) => {
  openApiSpec ??= await buildOpenApiSpec();
  return c.json(openApiSpec);
});

app.post(
  "/polls",
  spaceApiKeyAuth,
  rateLimit,
  describeRoute({
    tags: ["Polls"],
    summary: "Create a poll",
    description: [
      "Creates a poll and responds with `201 Created` and the full poll, exactly as `GET /polls/:pollId` returns it. Share `inviteUrl` with participants. The request mirrors the response: `kind` chooses what participants vote on, and `options` takes the same shape the poll returns, so a poll can be recreated from the body of a `GET`. A poll has at most 100 options.",
      "",
      "## Date poll",
      "",
      'Pass `kind: "date"` and `options`, one `{ "date": "YYYY-MM-DD" }` per day. Each becomes one all-day option. Dates are floating calendar days with no timezone, so never convert them through one. Duplicate dates are removed.',
      "",
      "```json",
      "{",
      '  "title": "Team offsite",',
      '  "kind": "date",',
      '  "options": [{ "date": "2027-03-01" }, { "date": "2027-03-02" }, { "date": "2027-03-03" }]',
      "}",
      "```",
      "",
      "## Time poll",
      "",
      'Pass `kind: "time"`, optionally a `timeZone` (an IANA zone the times are written in) and a default `duration` in minutes, and the slots as `options`, `generators` or both.',
      "",
      "### Explicit slots",
      "",
      "Each entry in `options` is one slot: a `startTime` and an optional `duration` that overrides the poll default. A `startTime` with no offset, like `2027-03-01T09:00:00`, is wall clock time in `timeZone` when that is set and a floating time with no conversion otherwise; one with an offset or `Z` is an absolute instant.",
      "",
      "```json",
      "{",
      '  "title": "Kickoff",',
      '  "kind": "time",',
      '  "timeZone": "Europe/London",',
      '  "duration": 60,',
      '  "options": [',
      '    { "startTime": "2027-03-01T09:00:00" },',
      '    { "startTime": "2027-03-02T14:00:00", "duration": 90 }',
      "  ]",
      "}",
      "```",
      "",
      "### Slot generators",
      "",
      "Each object in `generators` expands into recurring slots of `duration` minutes from a schedule, so availability across days or weeks does not have to be listed slot by slot. `duration` is required when `generators` is set.",
      "",
      "```json",
      "{",
      '  "title": "Interview availability",',
      '  "kind": "time",',
      '  "timeZone": "America/New_York",',
      '  "duration": 30,',
      '  "generators": [',
      "    {",
      '      "startDate": "2027-03-01",',
      '      "endDate": "2027-03-05",',
      '      "days": ["mon", "tue", "wed", "thu", "fri"],',
      '      "from": "09:00",',
      '      "to": "12:00",',
      '      "interval": 60',
      "    }",
      "  ]",
      "}",
      "```",
      "",
      "This produces 30 minute slots at 09:00, 10:00 and 11:00 New York time on each weekday from 1 to 5 March, fifteen options in all. Drop `interval` and the window fills with back to back slots at 09:00, 09:30, 10:00, 10:30, 11:00 and 11:30.",
      "",
      "| Field | Meaning |",
      "| --- | --- |",
      "| `startDate`, `endDate` | The date range, inclusive. Fewer than 366 days. |",
      "| `days` | Days of the week to include: `mon` to `sun`. Optional; defaults to every day. |",
      "| `from` | Earliest slot start on each day, `HH:mm` in `timeZone`. |",
      "| `to` | End of the daily window, `HH:mm` in `timeZone`. A slot is only generated if it ends by this time. Must be later than `from`. |",
      "| `interval` | Minutes between slot starts. Optional; defaults to `duration`, which gives back to back slots. |",
      "",
      "A generator that cannot produce a slot is rejected with `VALIDATION_ERROR` naming the field: `to` not later than `from`, a window shorter than `duration`, or a range that contains none of the listed days. Generators are expanded when the poll is created, the result is appended to `options`, and duplicate slots are removed. A request that would exceed 100 options fails with `TOO_MANY_OPTIONS`.",
    ].join("\n"),
    security: [{ bearerAuth: [] }],
    responses: {
      201: {
        description: "Poll created",
        content: {
          "application/json": {
            schema: resolver(pollResponseSchema),
          },
        },
      },
      400: {
        description: "Invalid input",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
      401: unauthorizedResponse,
      403: spaceNotProResponse,
      429: rateLimitExceededResponse,
      503: serviceUnavailableResponse,
    },
  }),
  validator("json", createPollInputSchema, validationHook),
  async (c) => {
    const input = c.req.valid("json");
    const { spaceId, spaceOwnerId } = c.get("apiAuth");

    // Determine the organizer userId
    let organizerUserId = spaceOwnerId;

    if (input.organizer) {
      const spaceMember = await getSpaceMemberByEmail({
        spaceId,
        email: input.organizer.email,
      });

      if (!spaceMember) {
        return c.json(
          apiError(
            "ORGANIZER_NOT_MEMBER",
            "The specified organizer is not a member of this space.",
          ),
          400,
        );
      }

      organizerUserId = spaceMember.userId;
    }

    const trackPollCreated = (poll: Awaited<ReturnType<typeof createPoll>>) => {
      const kind = poll.options.some((o) => o.duration > 0) ? "time" : "date";

      identifyGroup({
        groupType: "poll",
        groupKey: poll.id,
        properties: {
          name: poll.title,
          status: poll.status,
          kind,
          created_at: poll.createdAt,
          comment_count: 0,
          option_count: poll.options.length,
          has_location: !!poll.location,
          has_description: !!poll.description,
          timeZone: poll.timeZone,
          muted: false,
        },
      });

      track(
        { id: organizerUserId, isGuest: false },
        {
          event: "poll_create",
          properties: {
            title: poll.title,
            kind,
            source: "api",
            optionCount: poll.options.length,
            hasLocation: !!poll.location,
            hasDescription: !!poll.description,
            timeZone: poll.timeZone,
            requireParticipantEmail: input.requireEmail,
            hideParticipants: input.hideParticipants,
            hideScores: input.hideScores,
            disableComments: poll.disableComments,
            allowTentativeVotes: poll.allowTentativeVotes,
            isGuest: false,
          },
          groups: {
            poll: poll.id,
            space: spaceId,
          },
        },
      );

      after(() => flushPostHog());
    };

    if (input.kind === "date") {
      const dates = [...new Set(input.options.map((option) => option.date))];
      if (dates.length > MAX_POLL_OPTIONS) {
        return c.json(
          apiError(
            "TOO_MANY_OPTIONS",
            `Too many options (${dates.length}). Maximum allowed is ${MAX_POLL_OPTIONS}.`,
          ),
          400,
        );
      }

      const options = dates.map((date) => ({
        startTime: new Date(`${date}T00:00:00.000Z`),
        duration: 0,
      }));

      const poll = await createPoll({
        userId: organizerUserId,
        title: input.title,
        description: input.description,
        location: input.location,
        requireParticipantEmail: input.requireEmail,
        hideParticipants: input.hideParticipants,
        hideScores: input.hideScores,
        disableComments: input.disableComments,
        allowTentativeVotes: input.allowTentativeVotes,
        options,
        spaceId,
      });

      trackPollCreated(poll);

      return c.json(pollResponseSchema.parse(toPollResponseBody(poll)), 201);
    }

    const { timeZone } = input;
    // The schema guarantees a duration wherever it is read: every option
    // without its own carries the poll default, and generators require it.
    const defaultDuration = input.duration ?? 0;

    const timeSlots = [
      ...(input.options ?? []).map((option) =>
        parseStartTime(
          option.startTime,
          timeZone,
          option.duration ?? defaultDuration,
        ),
      ),
      ...(input.generators ?? []).flatMap((generator) => {
        const slotGenerator: SlotGeneratorInput = {
          startDate: generator.startDate,
          endDate: generator.endDate,
          daysOfWeek: generator.days,
          fromTime: generator.from,
          toTime: generator.to,
          interval: generator.interval,
        };
        return generateTimeSlots(slotGenerator, timeZone, defaultDuration);
      }),
    ];

    const options = dedupeTimeSlots(timeSlots);

    // Unreachable for inputs the schema accepts; guards the poll against an
    // expansion edge case (a window that vanishes on a DST change) rather
    // than creating it empty.
    if (!options.length) {
      return c.json(
        apiError(
          "VALIDATION_ERROR",
          "generators: no slot fits the daily window on any listed day.",
        ),
        400,
      );
    }

    if (options.length > MAX_POLL_OPTIONS) {
      return c.json(
        apiError(
          "TOO_MANY_OPTIONS",
          `Too many options generated (${options.length}). Maximum allowed is ${MAX_POLL_OPTIONS}.`,
        ),
        400,
      );
    }

    const poll = await createPoll({
      userId: organizerUserId,
      title: input.title,
      description: input.description,
      location: input.location,
      timeZone,
      requireParticipantEmail: input.requireEmail,
      hideParticipants: input.hideParticipants,
      hideScores: input.hideScores,
      disableComments: input.disableComments,
      allowTentativeVotes: input.allowTentativeVotes,
      options,
      spaceId,
    });

    trackPollCreated(poll);

    return c.json(pollResponseSchema.parse(toPollResponseBody(poll)), 201);
  },
);

app.get(
  "/polls",
  spaceApiKeyAuth,
  rateLimit,
  describeRoute({
    tags: ["Polls"],
    summary: "List polls",
    description: [
      "Lists the polls in the space associated with the API key, sorted by creation date (newest first).",
      "",
      "Use the `status` query parameter to only return polls in a given state — for example `status=open` to sweep polls that are still collecting responses. Results are paginated with a cursor: pass the `nextCursor` value from the previous response to fetch the next page.",
    ].join("\n"),
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(listPollsSuccessResponseSchema),
          },
        },
      },
      400: {
        description: "Invalid query parameters",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
      401: unauthorizedResponse,
      403: spaceNotProResponse,
      429: rateLimitExceededResponse,
      503: serviceUnavailableResponse,
    },
  }),
  validator("query", listPollsQuerySchema, validationHook),
  async (c) => {
    const { status, cursor, limit } = c.req.valid("query");
    const { spaceId } = c.get("apiAuth");

    const { polls, nextCursor } = await listPolls({
      spaceId,
      status,
      cursor,
      limit,
    });

    return c.json(
      listPollsSuccessResponseSchema.parse({
        data: polls.map((poll) => toPollResponseBody(poll).data),
        nextCursor,
      }),
    );
  },
);

app.get(
  "/polls/:pollId",
  spaceApiKeyAuth,
  rateLimit,
  describeRoute({
    tags: ["Polls"],
    summary: "Get a poll",
    description:
      "Retrieves a poll by ID with its options, settings, organizer and `participantCount`. The poll must belong to the space associated with the API key. Compare `updatedAt` between reads to notice changes.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(pollResponseSchema),
          },
        },
      },
      401: unauthorizedResponse,
      403: spaceNotProResponse,
      429: rateLimitExceededResponse,
      503: serviceUnavailableResponse,
      404: {
        description: "Poll not found",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
    },
  }),
  async (c) => {
    const { pollId } = c.req.param();
    const { spaceId } = c.get("apiAuth");

    const poll = await getPollWithOptions({ pollId, spaceId });

    if (!poll) {
      return c.json(
        apiError(
          "POLL_NOT_FOUND",
          "Poll not found or does not belong to this space.",
        ),
        404,
      );
    }

    return c.json(pollResponseSchema.parse(toPollResponseBody(poll)));
  },
);

app.patch(
  "/polls/:pollId",
  spaceApiKeyAuth,
  rateLimit,
  describeRoute({
    tags: ["Polls"],
    summary: "Update a poll",
    description: [
      'Updates a poll\'s status. Currently the only supported transition is closing a poll by sending `{ "status": "closed" }`.',
      "",
      "Close a poll once you have picked a date or the poll is no longer needed. Closing is non-destructive — the poll and its responses are preserved — but the results become final and participants can no longer vote. Consumers polling `GET /polls/:pollId/results` should remove closed polls from their queues.",
      "",
      "Closing is idempotent: closing an already-closed poll returns a `200` with the poll unchanged. The other statuses (`open`, `scheduled`, `canceled`) are not available via the API and return `422`.",
    ].join("\n"),
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Poll updated successfully",
        content: {
          "application/json": {
            schema: resolver(pollResponseSchema),
          },
        },
      },
      401: unauthorizedResponse,
      403: spaceNotProResponse,
      429: rateLimitExceededResponse,
      503: serviceUnavailableResponse,
      404: {
        description: "Poll not found",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
      422: {
        description: "The requested status transition is not available",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
    },
  }),
  validator("json", patchPollInputSchema, validationHook),
  async (c) => {
    const { pollId } = c.req.param();
    const { status } = c.req.valid("json");
    const { spaceId } = c.get("apiAuth");

    if (status !== "closed") {
      return c.json(
        apiError(
          "TRANSITION_NOT_AVAILABLE",
          `Transitioning a poll to "${status}" is not available via the API. Only "closed" is supported.`,
        ),
        422,
      );
    }

    const poll = await closePoll({ pollId, spaceId });

    if (!poll) {
      return c.json(
        apiError(
          "POLL_NOT_FOUND",
          "Poll not found or does not belong to this space.",
        ),
        404,
      );
    }

    return c.json(pollResponseSchema.parse(toPollResponseBody(poll)));
  },
);

app.get(
  "/polls/:pollId/results",
  spaceApiKeyAuth,
  rateLimit,
  describeRoute({
    tags: ["Polls"],
    summary: "Get poll results",
    description: [
      "Retrieves aggregated voting results for a poll: vote counts per option without individual participant data. Use `GET /polls/:pollId/participants` for per-person availability.",
      "",
      "`votes` lists every vote type the poll offers with its count, zero included. `score` is an opaque ranking value: sort by it to order options from best to worst, and use `isTopChoice` or `highScore` to find the leading options. Its formula is not part of the contract, so do not decode it, compare it across polls or threshold on it.",
    ].join("\n"),
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(getPollResultsSuccessResponseSchema),
          },
        },
      },
      401: unauthorizedResponse,
      403: spaceNotProResponse,
      429: rateLimitExceededResponse,
      503: serviceUnavailableResponse,
      404: {
        description: "Poll not found",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
    },
  }),
  async (c) => {
    const { pollId } = c.req.param();
    const { spaceId } = c.get("apiAuth");

    const data = await getPollResults({ pollId, spaceId });

    if (!data) {
      return c.json(
        apiError(
          "POLL_NOT_FOUND",
          "Poll not found or does not belong to this space.",
        ),
        404,
      );
    }

    return c.json(
      getPollResultsSuccessResponseSchema.parse({
        data: {
          pollId: data.pollId,
          kind: data.kind,
          status: data.status,
          participantCount: data.participantCount,
          options: data.options.map((option) => ({
            ...toOptionResponse(data.kind, option),
            votes: option.votes,
            score: option.score,
            isTopChoice: option.isTopChoice,
          })),
          highScore: data.highScore,
        },
      }),
    );
  },
);

app.get(
  "/polls/:pollId/participants",
  spaceApiKeyAuth,
  rateLimit,
  describeRoute({
    tags: ["Polls"],
    summary: "List poll participants",
    description: [
      "Lists the participants of a poll with their votes, oldest response first. The poll must belong to the space associated with the API key.",
      "",
      "Each participant's `votes` pairs an `optionId` from the poll with the answer they gave, so this is the endpoint for per-person availability. Results are paginated with a cursor: pass the `nextCursor` value from the previous response to fetch the next page.",
    ].join("\n"),
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(getPollParticipantsSuccessResponseSchema),
          },
        },
      },
      400: {
        description: "Invalid query parameters",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
      401: unauthorizedResponse,
      403: spaceNotProResponse,
      429: rateLimitExceededResponse,
      503: serviceUnavailableResponse,
      404: {
        description: "Poll not found",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
    },
  }),
  validator("query", listParticipantsQuerySchema, validationHook),
  async (c) => {
    const { pollId } = c.req.param();
    const { cursor, limit } = c.req.valid("query");
    const { spaceId } = c.get("apiAuth");

    const data = await getPollParticipants({ pollId, spaceId, cursor, limit });

    if (!data) {
      return c.json(
        apiError(
          "POLL_NOT_FOUND",
          "Poll not found or does not belong to this space.",
        ),
        404,
      );
    }

    return c.json(
      getPollParticipantsSuccessResponseSchema.parse({
        data: data.participants.map((participant) => ({
          id: participant.id,
          name: participant.name,
          email: participant.email,
          createdAt: participant.createdAt.toISOString(),
          votes: participant.votes,
        })),
        nextCursor: data.nextCursor,
      }),
    );
  },
);

app.delete(
  "/polls/:pollId",
  spaceApiKeyAuth,
  rateLimit,
  describeRoute({
    tags: ["Polls"],
    summary: "Delete a poll",
    description:
      "Deletes a poll by ID. The poll must belong to the space associated with the API key.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Poll deleted successfully",
        content: {
          "application/json": {
            schema: resolver(deletePollSuccessResponseSchema),
          },
        },
      },
      401: unauthorizedResponse,
      403: spaceNotProResponse,
      429: rateLimitExceededResponse,
      503: serviceUnavailableResponse,
      404: {
        description: "Poll not found",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
    },
  }),
  async (c) => {
    const { pollId } = c.req.param();
    const { spaceId } = c.get("apiAuth");

    const result = await deletePoll(pollId, spaceId);

    if (!result) {
      return c.json(
        apiError(
          "POLL_NOT_FOUND",
          "Poll not found or does not belong to this space.",
        ),
        404,
      );
    }

    return c.json(
      deletePollSuccessResponseSchema.parse({
        data: {
          id: result.id,
          deleted: true,
        },
      }),
    );
  },
);

export { app };

const APP_PREFIX = "/api";

// Requests reach this file two ways: on the public host as `/v1/...` (the
// next.config rewrite keeps the original URL, so that is what arrives here)
// and on the app host as `/api/v1/...`. Both must hit the same Hono routes,
// so the app prefix is stripped before dispatch. The forwarded request is
// built field by field: `new Request(url, request)` drops the method under
// vitest.
async function handler(request: Request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(`${APP_PREFIX}/v1`)) {
    return app.fetch(request);
  }
  url.pathname = url.pathname.slice(APP_PREFIX.length);
  return app.fetch(
    new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      duplex: "half",
    } as RequestInit),
  );
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
