import crypto from "node:crypto";
import { z } from "@hono/zod-openapi";
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
import type {
  ExplicitOptionInput,
  SlotGeneratorInput,
} from "../utils/time-slots";
import {
  dedupeTimeSlots,
  generateTimeSlots,
  toTimeSlot,
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

const app = new Hono<{ Variables: Variables }>().basePath("/api/private/v1");

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

    c.set("apiAuth", { userId: apiKey.userId, apiKeyId: apiKey.id });

    waitUntil(
      prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      }),
    );

    return true;
  },
});

const explicitTimeRangeOptionSchema = z
  .object({
    date: dateSchema,
    from: timeSchema,
    to: timeSchema,
  })
  .openapi("ExplicitTimeRangeOption")
  .refine(
    (value) =>
      dayjs(`${value.date}T${value.to}`).isAfter(`${value.date}T${value.from}`),
    { message: "`to` must be after `from`" },
  );

const explicitDateTimeOptionSchema = z
  .object({
    start: z.iso.datetime().openapi({
      description: "Start datetime",
      example: "2025-12-23T09:30:00Z",
    }),
    end: z.iso.datetime().openapi({
      description: "End datetime",
      example: "2025-12-23T10:00:00Z",
    }),
  })
  .openapi("ExplicitDateTimeOption");

const slotGeneratorSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
    daysOfWeek: z.array(
      z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
    ),
    fromTime: timeSchema,
    toTime: timeSchema,
    discreteIntervalMinutes: z.number().int().positive().optional(),
  })
  .openapi("SlotGenerator");

const slotGeneratorInputSchema = z
  .union([slotGeneratorSchema, z.array(slotGeneratorSchema).min(1)])
  .openapi({
    description: "A slot generator or list of slot generators",
  });

const createPollInputBaseSchema = z
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
    timezone: z.string().min(1).openapi({
      description: "IANA timezone",
      example: "Europe/London",
    }), // TODO: Should this be optional? Use user timezone
    requireParticipantEmail: z.boolean().default(false),
    locale: z.string().optional().openapi({ example: "en" }),
    duration: z
      .number()
      .int()
      .min(15)
      .max(1440) // 1440 minutes = 24 hours
      .openapi({ example: 30 }),
    options: z
      .array(
        z.union([explicitTimeRangeOptionSchema, explicitDateTimeOptionSchema]),
      )
      .optional(),
    slotGenerator: slotGeneratorInputSchema.optional(),
  })
  .openapi("CreatePollInput");

const createPollInputSchema = createPollInputBaseSchema.refine(
  (value) => value.options?.length || value.slotGenerator,
  {
    message: "Either `options` or `slotGenerator` must be provided",
  },
);

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
    error: z.string().openapi({ example: "No valid options generated" }),
  })
  .openapi("ErrorResponse");

app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      openapi: "3.1.0",
      info: {
        title: "Rallly Private API",
        version: "1.0.0",
      },
      servers: [{ url: "/api/private/v1" }],
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
    url: "/api/private/v1/openapi",
    pageTitle: "Rallly Private API Documentation",
  }),
);

app.post(
  "/polls",
  apiKeyAuth,
  describeRoute({
    description: "Create a poll",
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

    const pollId = nanoid();

    const explicitOptions =
      input.options
        ?.map((o) => toTimeSlot(o as ExplicitOptionInput, input.timezone))
        .filter(Boolean) ?? [];

    const generateOptionsFromSlotGenerator = (
      slotGenerator: SlotGeneratorInput,
      duration: number,
    ) => generateTimeSlots(slotGenerator, input.timezone, duration);

    const duration = input.duration;
    const slotGenerators = input.slotGenerator
      ? Array.isArray(input.slotGenerator)
        ? input.slotGenerator
        : [input.slotGenerator]
      : [];

    const generatedOptions = slotGenerators.flatMap((slotGenerator) =>
      generateOptionsFromSlotGenerator(
        slotGenerator as SlotGeneratorInput,
        duration,
      ),
    );

    const options = dedupeTimeSlots([...explicitOptions, ...generatedOptions]);
    if (!options.length) {
      return c.json({ error: "No valid options generated" }, 400);
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
        timeZone: input.timezone,
        description: input.description || undefined,
        adminUrlId: nanoid(),
        participantUrlId: nanoid(),
        userId,
        watchers: {
          create: {
            userId,
          },
        },
        options: {
          createMany: {
            data: options,
          },
        },
        requireParticipantEmail: input.requireParticipantEmail,
        spaceId: spaceMember?.spaceId,
      },
      select: {
        id: true,
      },
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
