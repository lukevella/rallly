import { RedisStore } from "@hono-rate-limiter/redis";
import { prisma } from "@rallly/database";
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
import { isKvEnabled, kv } from "@/lib/kv";
import { isSupportedTimeZone } from "@/utils/supported-time-zones";
import {
  createPollInputSchema,
  createPollSuccessResponseSchema,
  errorResponseSchema,
} from "../schemas";
import { spaceApiKeyAuth } from "../utils/api-key";
import { apiError, createPoll } from "../utils/poll";
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
      servers: [{ url: "/api/private" }],
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

    const user = await prisma.user.findUnique({
      where: { id: spaceOwnerId },
      select: { id: true, timeZone: true },
    });

    if (!user) {
      return c.json(apiError("UNAUTHORIZED", "User not found"), 401);
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
        userId: user.id,
        title: input.title,
        description: input.description,
        location: input.location,
        requireParticipantEmail: input.requireEmail,
        hideParticipants: input.hideParticipants,
        hideScores: input.hideScores,
        disableComments: input.disableComments,
        options,
        spaceId,
        spaceOwnerId,
      });

      return c.json({
        data: {
          id: poll.id,
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
    const timeZone = slots.timezone ?? user?.timeZone;

    if (!timeZone) {
      return c.json(
        apiError(
          "TIMEZONE_REQUIRED",
          "Timezone is required. Either provide a timezone in slots or set one in your profile.",
        ),
        400,
      );
    }

    if (!isSupportedTimeZone(timeZone)) {
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
      userId: spaceOwnerId,
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
      spaceOwnerId,
    });

    return c.json({
      data: {
        id: poll.id,
        adminUrl: poll.adminUrl,
        inviteUrl: poll.inviteUrl,
      },
    });
  },
);

export { app };

export const GET = handle(app);
export const POST = handle(app);
