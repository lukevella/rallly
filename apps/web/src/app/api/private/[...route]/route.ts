import crypto from "node:crypto";
import { z } from "@hono/zod-openapi";
import { RedisStore } from "@hono-rate-limiter/redis";
import { prisma } from "@rallly/database";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { nanoid } from "@rallly/utils/nanoid";
import { Scalar } from "@scalar/hono-api-reference";
import { waitUntil } from "@vercel/functions";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
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
import type { SlotGeneratorInput } from "../utils/time-slots";
import {
  dedupeTimeSlots,
  generateTimeSlots,
  parseStartTime,
} from "../utils/time-slots";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

type ApiAuth = {
  userId: string;
  apiKeyId: string;
};

type Variables = {
  apiAuth: ApiAuth;
};

type Env = {
  Variables: Variables;
};

const app = new Hono<Env>().basePath("/api/private");

const MAX_OPTIONS = 100;

const dateSchema = z.iso.date().openapi({
  description: "Date in YYYY-MM-DD format",
  example: "2025-12-23",
});

const timeSchema = z.iso.time().openapi({
  description: "Time in HH:mm (24-hour) format",
  example: "09:30",
});

const extractApiKeyPrefix = (rawKey: string) => {
  const parts = rawKey.split("_").filter(Boolean);
  if (parts.length >= 3 && parts[1]) {
    return parts[1];
  }
  return rawKey.slice(0, 12);
};

const isHexSha256 = (value: string) => /^[a-f0-9]{64}$/i.test(value);

const hashApiKey = (rawKey: string, salt?: string) => {
  const input = salt ? `${salt}:${rawKey}` : rawKey;
  return crypto.createHash("sha256").update(input).digest("hex");
};

const verifyApiKey = (rawKey: string, stored: string) => {
  const trimmed = stored.trim();
  if (trimmed.startsWith("sha256$")) {
    const [, salt, hash] = trimmed.split("$");
    if (!salt || !hash || !isHexSha256(hash)) {
      return false;
    }
    const computed = hashApiKey(rawKey, salt);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  }

  if (!isHexSha256(trimmed)) {
    return false;
  }

  const computed = hashApiKey(rawKey);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(trimmed));
};

const apiKeyAuth = bearerAuth({
  verifyToken: async (rawKey, c) => {
    const prefix = extractApiKeyPrefix(rawKey);

    const apiKey = await prisma.apiKey.findUnique({
      where: { prefix },
      select: {
        id: true,
        userId: true,
        hashedKey: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!apiKey) {
      return false;
    }

    if (apiKey.revokedAt) {
      return false;
    }

    if (apiKey.expiresAt && apiKey.expiresAt <= new Date()) {
      return false;
    }

    if (!verifyApiKey(rawKey, apiKey.hashedKey)) {
      return false;
    }

    c.set("apiAuth", {
      userId: apiKey.userId,
      apiKeyId: apiKey.id,
    });

    waitUntil(
      prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      }),
    );

    return true;
  },
});

const slotGeneratorSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
    days: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])),
    startTime: timeSchema,
    endTime: timeSchema,
    interval: z.number().int().min(15).max(1440).optional().openapi({
      description: "Interval in minutes between slots. Defaults to duration.",
      example: 30,
    }),
  })
  .openapi("SlotGenerator");

const timeOptionSchema = z.union([
  z.iso.datetime().openapi({
    description: "ISO datetime start time",
    example: "2025-01-15T09:00:00Z",
  }),
  slotGeneratorSchema,
]);

const slotsInputSchema = z
  .object({
    duration: z.number().int().min(15).max(1440).openapi({
      description: "Duration in minutes for each time slot",
      example: 30,
    }),
    timezone: z
      .string()
      .refine(isSupportedTimeZone, {
        message: "Timezone must be a valid IANA timezone",
      })
      .optional()
      .openapi({
        description:
          "IANA timezone. Defaults to user's timezone if not provided.",
        example: "Europe/London",
      }),
    times: z
      .union([slotGeneratorSchema, z.array(timeOptionSchema).min(1)])
      .openapi({
        description:
          "Times to include. Can be a slot generator or an array of ISO datetime strings and/or slot generators.",
      }),
  })
  .openapi("SlotsInput");

const datesInputSchema = z
  .array(z.iso.date())
  .min(1)
  .openapi({
    description: "Array of ISO dates for all-day options",
    example: ["2025-01-15", "2025-01-16", "2025-01-17"],
  });

const createPollInputSchema = z
  .object({
    title: z.string().trim().min(1).openapi({ example: "Team sync" }),
    description: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .openapi({ example: "Pick a time that works for everyone" }),
    location: z
      .string()
      .trim()
      .max(255)
      .optional()
      .openapi({ example: "Zoom" }),
    dates: datesInputSchema.optional(),
    slots: slotsInputSchema.optional(),
  })
  .refine((data) => data.dates || data.slots, {
    message: "Either 'dates' or 'slots' must be provided",
  })
  .refine((data) => !(data.dates && data.slots), {
    message: "Cannot provide both 'dates' and 'slots'",
  })
  .openapi("CreatePollInput");

const createPollSuccessResponseSchema = z
  .object({
    data: z.object({
      id: z.string().openapi({ example: "p_123abc" }),
      adminUrl: z
        .string()
        .openapi({ example: "https://example.com/poll/p_123abc" }),
      inviteUrl: z
        .string()
        .openapi({ example: "https://example.com/invite/p_123abc" }),
    }),
  })
  .openapi("CreatePollResponse");

const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: "TIMEZONE_REQUIRED" }),
      message: z.string().openapi({
        example:
          "Timezone is required. Either provide a timezone in the request or set one in your profile.",
      }),
    }),
  })
  .openapi("ErrorResponse");

const apiError = (code: string, message: string) => ({
  error: { code, message },
});

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
  apiKeyAuth,
  rateLimiter<{ Variables: Variables }>({
    windowMs: 60 * 1000,
    limit: 60,
    keyGenerator: (c) => {
      const apiKeyId = c.var.apiAuth.apiKeyId;
      return `private-api:polls-create:${apiKeyId}`;
    },
    store: isKvEnabled ? new RedisStore({ client: kv }) : undefined,
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
    const { userId } = c.get("apiAuth");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timeZone: true },
    });

    const pollId = nanoid();

    // Process dates (all-day options)
    if (input.dates) {
      const uniqueDates = [...new Set(input.dates)];
      const options = uniqueDates.map((date) => ({
        startTime: new Date(`${date}T00:00:00.000Z`),
        duration: 0,
      }));

      if (options.length > MAX_OPTIONS) {
        return c.json(
          apiError(
            "TOO_MANY_OPTIONS",
            `Too many options (${options.length}). Maximum allowed is ${MAX_OPTIONS}.`,
          ),
          400,
        );
      }

      const spaceMember = await prisma.spaceMember.findFirst({
        where: { userId },
        orderBy: { lastSelectedAt: "desc" },
        select: { spaceId: true },
      });

      const poll = await prisma.poll.create({
        data: {
          id: pollId,
          title: input.title,
          description: input.description || undefined,
          adminUrlId: nanoid(),
          participantUrlId: nanoid(),
          userId,
          watchers: { create: { userId } },
          options: { createMany: { data: options } },
          spaceId: spaceMember?.spaceId,
        },
        select: { id: true },
      });

      return c.json({
        data: {
          id: poll.id,
          adminUrl: absoluteUrl(`/poll/${poll.id}`),
          inviteUrl: shortUrl(`/invite/${poll.id}`),
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
    const timezone = slots.timezone ?? user?.timeZone;

    if (!timezone) {
      return c.json(
        apiError(
          "TIMEZONE_REQUIRED",
          "Timezone is required. Either provide a timezone in slots or set one in your profile.",
        ),
        400,
      );
    }

    if (!isSupportedTimeZone(timezone)) {
      return c.json(
        apiError(
          "INVALID_TIMEZONE",
          `Invalid timezone: ${timezone}. Please provide a valid IANA timezone.`,
        ),
        400,
      );
    }

    const duration = slots.duration;
    const times = Array.isArray(slots.times) ? slots.times : [slots.times];

    const timeSlots = times.flatMap((time) => {
      if (typeof time === "string") {
        return parseStartTime(time, timezone, duration);
      }
      const slotGenerator: SlotGeneratorInput = {
        startDate: time.startDate,
        endDate: time.endDate,
        daysOfWeek: time.days,
        fromTime: time.startTime,
        toTime: time.endTime,
        interval: time.interval,
      };
      return generateTimeSlots(slotGenerator, timezone, duration);
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

    const spaceMember = await prisma.spaceMember.findFirst({
      where: { userId },
      orderBy: { lastSelectedAt: "desc" },
      select: { spaceId: true },
    });

    const poll = await prisma.poll.create({
      data: {
        id: pollId,
        title: input.title,
        timeZone: timezone,
        description: input.description || undefined,
        adminUrlId: nanoid(),
        participantUrlId: nanoid(),
        userId,
        watchers: { create: { userId } },
        options: { createMany: { data: options } },
        spaceId: spaceMember?.spaceId,
      },
      select: { id: true },
    });

    return c.json({
      data: {
        id: poll.id,
        adminUrl: absoluteUrl(`/poll/${poll.id}`),
        inviteUrl: shortUrl(`/invite/${poll.id}`),
      },
    });
  },
);

export const GET = handle(app);
export const POST = handle(app);

