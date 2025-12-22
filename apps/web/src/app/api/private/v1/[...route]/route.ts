import crypto from "node:crypto";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "@rallly/database";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { nanoid } from "@rallly/utils/nanoid";
import { waitUntil } from "@vercel/functions";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { handle } from "hono/vercel";
import { z } from "zod";
import type { ExplicitOptionInput } from "../utils/time-slots";
import { generateTimeSlots, toPollOption } from "../utils/time-slots";

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

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

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

app.use(
  "*",
  bearerAuth({
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
  }),
);

const createPollInputSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().optional(),
    timezone: z.string().min(1), // TODO: Should this be optional? Use user timezone
    requireParticipantEmail: z.boolean().default(false),
    locale: z.string().optional(),
    duration: z.number().int().positive().optional(),
    options: z
      .array(
        z.union([
          z
            .object({
              date: dateSchema,
              from: timeSchema,
              to: timeSchema,
            })
            .refine(
              (value) =>
                dayjs(`${value.date}T${value.to}`).isAfter(
                  `${value.date}T${value.from}`,
                ),
              { message: "`to` must be after `from`" },
            ),
          z.object({
            start: z.string().min(1),
            end: z.string().min(1),
          }),
        ]),
      )
      .optional(),
    slotGenerator: z
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
      .optional(),
  })
  .refine((value) => value.options?.length || value.slotGenerator, {
    message: "Either `options` or `slotGenerator` must be provided",
  })
  .refine((value) => (value.slotGenerator ? !!value.duration : true), {
    message: "`duration` is required when `slotGenerator` is provided",
  });

app.post("/polls", zValidator("json", createPollInputSchema), async (c) => {
  const input = c.req.valid("json");
  const { userId } = c.get("apiAuth");

  const pollId = nanoid();

  const explicitOptions =
    input.options
      ?.map((o) => toPollOption(o as ExplicitOptionInput, input.timezone))
      .filter(Boolean) ?? [];

  const generatedOptions = input.slotGenerator
    ? generateTimeSlots(
        input.slotGenerator,
        input.timezone,
        input.duration ?? 0,
      )
    : [];

  const options = [...explicitOptions, ...generatedOptions];
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
});

export const GET = handle(app);
export const POST = handle(app);
