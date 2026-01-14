import { RedisStore } from "@hono-rate-limiter/redis";
import { prisma } from "@rallly/database";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import {
  describeRoute,
  openAPIRouteHandler,
  resolver,
  validator,
} from "hono-openapi";
import { rateLimiter } from "hono-rate-limiter";
import { getPollParticipants, getPollResults } from "@/features/poll/data";
import { createPoll, deletePoll } from "@/features/poll/mutations";
import { isKvEnabled, kv } from "@/lib/kv";
import { isSupportedTimeZone } from "@/utils/supported-time-zones";
import {
  createPollInputSchema,
  createPollSuccessResponseSchema,
  deletePollSuccessResponseSchema,
  errorResponseSchema,
  getPollParticipantsSuccessResponseSchema,
  getPollResultsSuccessResponseSchema,
  getPollSuccessResponseSchema,
} from "../schemas";
import { spaceApiKeyAuth } from "../utils/api-key";
import { apiError } from "../utils/poll";
import type { SlotGeneratorInput } from "../utils/time-slots";
import {
  dedupeTimeSlots,
  generateTimeSlots,
  parseStartTime,
} from "../utils/time-slots";

type Env = {
  Variables: {
    apiAuth: {
      spaceId: string;
      spaceOwnerId: string;
      apiKeyId: string;
    };
  };
};

const app = new Hono<Env>().basePath("/api/private");

const MAX_OPTIONS = 100;

app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "Rallly Private API",
        version: "0.0.1",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
          },
        },
      },
    },
  }),
);

app.get(
  "/docs",
  Scalar({
    url: "/api/private/openapi",
    pageTitle: "Rallly Private API Documentation",
    theme: "purple",
  }),
);

app.post(
  "/polls",
  spaceApiKeyAuth,
  rateLimiter<Env>({
    windowMs: 60 * 1000,
    limit: 60,
    keyGenerator: (c) => {
      const { apiKeyId } = c.get("apiAuth");
      return `private-api:polls-create:${apiKeyId}`;
    },
    store: isKvEnabled() ? new RedisStore({ client: kv }) : undefined,
  }),
  describeRoute({
    tags: ["Polls"],
    summary: "Create a poll",
    description:
      "Creates a new poll with the specified options or slot generators.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(createPollSuccessResponseSchema),
          },
        },
      },
      400: {
        description: "Invalid input or no valid options generated",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
    },
  }),
  validator("json", createPollInputSchema),
  async (c) => {
    const input = c.req.valid("json");
    const { spaceId, spaceOwnerId } = c.get("apiAuth");

    // Determine the organizer userId
    let organizerUserId = spaceOwnerId;

    if (input.organizer) {
      const spaceMember = await prisma.spaceMember.findFirst({
        where: {
          spaceId,
          user: {
            email: input.organizer.email,
          },
        },
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
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

      organizerUserId = spaceMember.user.id;
    }

    // Process dates (all-day options)
    if (input.dates) {
      if (input.dates.length > MAX_OPTIONS) {
        return c.json(
          apiError(
            "TOO_MANY_OPTIONS",
            `Too many options (${input.dates.length}). Maximum allowed is ${MAX_OPTIONS}.`,
          ),
          400,
        );
      }

      const uniqueDates = [...new Set(input.dates)];
      if (uniqueDates.length < input.dates.length) {
        const duplicateCount = input.dates.length - uniqueDates.length;
        return c.json(
          apiError(
            "DUPLICATE_DATES",
            `Duplicate dates found. Please remove ${duplicateCount} duplicate date${duplicateCount > 1 ? "s" : ""}.`,
          ),
          400,
        );
      }

      const options = uniqueDates.map((date) => ({
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
        options,
        spaceId,
      });

      return c.json({
        data: {
          id: poll.id,
          title: poll.title,
          description: poll.description,
          location: poll.location,
          timeZone: poll.timeZone,
          status: poll.status,
          createdAt: poll.createdAt.toISOString(),
          user: poll.user
            ? {
                name: poll.user.name,
                image: poll.user.image,
              }
            : null,
          options: poll.options.map((option) => ({
            id: option.id,
            startTime: option.startTime.toISOString(),
            duration: option.duration,
          })),
          adminUrl: poll.adminUrl,
          inviteUrl: poll.inviteUrl,
        },
      });
    }

    // Process slots (time-based options)
    if (!input.slots) {
      return c.json(
        apiError("INVALID_INPUT", "Either 'dates' or 'slots' must be provided"),
        400,
      );
    }

    const slots = input.slots;
    const timeZone = slots.timezone;

    if (timeZone && !isSupportedTimeZone(timeZone)) {
      return c.json(
        apiError(
          "INVALID_TIMEZONE",
          `Invalid timezone: ${timeZone}. Please provide a valid IANA timezone.`,
        ),
        400,
      );
    }

    const duration = slots.duration;
    const times = Array.isArray(slots.times) ? slots.times : [slots.times];

    const timeSlots = times.flatMap((time) => {
      if (typeof time === "string") {
        return parseStartTime(time, timeZone, duration);
      }
      const slotGenerator: SlotGeneratorInput = {
        startDate: time.startDate,
        endDate: time.endDate,
        daysOfWeek: time.days,
        fromTime: time.startTime,
        toTime: time.endTime,
        interval: time.interval,
      };
      return generateTimeSlots(slotGenerator, timeZone, duration);
    });

    const options = dedupeTimeSlots(timeSlots);

    if (!options.length) {
      return c.json(
        apiError(
          "NO_OPTIONS_GENERATED",
          "No valid options were generated. Check that your slot generators produce valid time slots.",
        ),
        400,
      );
    }

    if (options.length > MAX_OPTIONS) {
      return c.json(
        apiError(
          "TOO_MANY_OPTIONS",
          `Too many options generated (${options.length}). Maximum allowed is ${MAX_OPTIONS}.`,
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
      options,
      spaceId,
    });

    return c.json({
      data: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        location: poll.location,
        timezone: poll.timeZone,
        status: poll.status,
        createdAt: poll.createdAt.toISOString(),
        user: poll.user
          ? {
              name: poll.user.name,
              image: poll.user.image,
            }
          : null,
        options: poll.options.map((option) => ({
          id: option.id,
          startTime: option.startTime.toISOString(),
          duration: option.duration,
        })),
        adminUrl: poll.adminUrl,
        inviteUrl: poll.inviteUrl,
      },
    });
  },
);

app.get(
  "/polls/:pollId",
  spaceApiKeyAuth,
  rateLimiter<Env>({
    windowMs: 60 * 1000,
    limit: 120,
    keyGenerator: (c) => {
      const { apiKeyId } = c.get("apiAuth");
      return `private-api:polls-get:${apiKeyId}`;
    },
    store: isKvEnabled() ? new RedisStore({ client: kv }) : undefined,
  }),
  describeRoute({
    tags: ["Polls"],
    summary: "Get a poll",
    description:
      "Retrieves poll metadata by ID. The poll must belong to the space associated with the API key.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(getPollSuccessResponseSchema),
          },
        },
      },
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

    const poll = await prisma.poll.findFirst({
      where: {
        id: pollId,
        spaceId,
        deleted: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        timeZone: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        options: {
          select: {
            id: true,
            startTime: true,
            duration: true,
          },
          orderBy: {
            startTime: "asc",
          },
        },
      },
    });

    if (!poll) {
      return c.json(
        apiError(
          "POLL_NOT_FOUND",
          "Poll not found or does not belong to this space.",
        ),
        404,
      );
    }

    return c.json({
      data: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        location: poll.location,
        timezone: poll.timeZone,
        status: poll.status,
        createdAt: poll.createdAt.toISOString(),
        user: poll.user
          ? {
              name: poll.user.name,
              image: poll.user.image,
            }
          : null,
        options: poll.options.map((option) => ({
          id: option.id,
          startTime: option.startTime.toISOString(),
          duration: option.duration,
        })),
        adminUrl: absoluteUrl(`/poll/${poll.id}`),
        inviteUrl: shortUrl(`/invite/${poll.id}`),
      },
    });
  },
);

app.get(
  "/polls/:pollId/results",
  spaceApiKeyAuth,
  rateLimiter<Env>({
    windowMs: 60 * 1000,
    limit: 120,
    keyGenerator: (c) => {
      const { apiKeyId } = c.get("apiAuth");
      return `private-api:polls-results:${apiKeyId}`;
    },
    store: isKvEnabled() ? new RedisStore({ client: kv }) : undefined,
  }),
  describeRoute({
    tags: ["Polls"],
    summary: "Get poll results",
    description:
      "Retrieves aggregated voting results for a poll. Returns vote counts per option without individual participant data.",
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

    return c.json({
      data,
    });
  },
);

app.get(
  "/polls/:pollId/participants",
  spaceApiKeyAuth,
  rateLimiter<Env>({
    windowMs: 60 * 1000,
    limit: 120,
    keyGenerator: (c) => {
      const { apiKeyId } = c.get("apiAuth");
      return `private-api:polls-participants:${apiKeyId}`;
    },
    store: isKvEnabled() ? new RedisStore({ client: kv }) : undefined,
  }),
  describeRoute({
    tags: ["Polls"],
    summary: "Get poll participants",
    description:
      "Retrieves all participants and their votes for a poll. The poll must belong to the space associated with the API key.",
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

    const data = await getPollParticipants({ pollId, spaceId });

    if (!data) {
      return c.json(
        apiError(
          "POLL_NOT_FOUND",
          "Poll not found or does not belong to this space.",
        ),
        404,
      );
    }

    return c.json({
      data,
    });
  },
);

app.delete(
  "/polls/:pollId",
  spaceApiKeyAuth,
  rateLimiter<Env>({
    windowMs: 60 * 1000,
    limit: 60,
    keyGenerator: (c) => {
      const { apiKeyId } = c.get("apiAuth");
      return `private-api:polls-delete:${apiKeyId}`;
    },
    store: isKvEnabled() ? new RedisStore({ client: kv }) : undefined,
  }),
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

    return c.json({
      data: {
        id: result.id,
        deleted: true as const,
      },
    });
  },
);

export { app };

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
