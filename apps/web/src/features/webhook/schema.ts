import * as z from "zod";
import { pollClosedReasonSchema } from "@/features/poll/schema";
import { getWebhookUrlRejection } from "./utils";

export const webhookEventTypeSchema = z
  .enum(["poll.closed", "poll.reopened", "poll.scheduled"])
  .meta({
    id: "WebhookEventType",
    description: "The poll lifecycle transition the event records.",
    example: "poll.closed",
  });

export type WebhookEventType = z.infer<typeof webhookEventTypeSchema>;

export const WEBHOOK_EVENT_TYPES = webhookEventTypeSchema.options;

const webhookPollSchema = (status: "open" | "closed" | "scheduled") =>
  z
    .object({
      id: z.string().meta({ example: "Xk3pQ9vLm2Ab" }),
      title: z.string().meta({ example: "Team sync" }),
      status: z.literal(status).meta({
        description:
          "The status the transition moved the poll to. Reflects this event, not the poll's current state: a later transition arrives as its own event.",
      }),
      kind: z.enum(["date", "time"]).meta({ example: "time" }),
      timeZone: z.string().nullable().meta({ example: "Europe/London" }),
      adminUrl: z
        .string()
        .meta({ example: "https://app.rallly.co/poll/Xk3pQ9vLm2Ab" }),
      inviteUrl: z
        .string()
        .meta({ example: "https://rallly.co/invite/Xk3pQ9vLm2Ab" }),
    })
    .meta({ id: `WebhookPoll${status[0]?.toUpperCase()}${status.slice(1)}` });

const envelope = {
  id: z.string().meta({
    description:
      "Stable event id. Retries of the same event carry the same id, so receivers can deduplicate on it.",
    example: "cm5h8x2k40000q9l4f7e2d3an",
  }),
  createdAt: z.iso.datetime().meta({
    description: "When the transition happened.",
    example: "2025-01-12T08:30:00.000Z",
  }),
};

export const pollClosedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.closed"),
    data: z.object({
      poll: webhookPollSchema("closed"),
      reason: pollClosedReasonSchema.meta({
        description:
          "`manual` when the organizer closed the poll, `auto` when it closed because every option had passed.",
      }),
    }),
  })
  .meta({ id: "PollClosedEvent" });

export const pollReopenedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.reopened"),
    data: z.object({ poll: webhookPollSchema("open") }),
  })
  .meta({ id: "PollReopenedEvent" });

export const pollScheduledEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.scheduled"),
    data: z.object({
      poll: webhookPollSchema("scheduled"),
      option: z
        .union([
          z.object({
            id: z.string().meta({ example: "cm5h8x2k40000q9l4f7e2d3an" }),
            date: z.iso.date().meta({ example: "2025-01-15" }),
          }),
          z.object({
            id: z.string().meta({ example: "cm5h8x2k40000q9l4f7e2d3an" }),
            startTime: z.iso
              .datetime()
              .meta({ example: "2025-01-15T09:00:00.000Z" }),
            duration: z.int().positive().meta({ example: 30 }),
          }),
        ])
        .meta({
          description:
            "The option the poll was scheduled on. Its shape follows the poll's `kind`: a date for `date` polls, a start time and duration for `time` polls.",
        }),
    }),
  })
  .meta({ id: "PollScheduledEvent" });

export const webhookEventSchema = z
  .discriminatedUnion("type", [
    pollClosedEventSchema,
    pollReopenedEventSchema,
    pollScheduledEventSchema,
  ])
  .meta({ id: "WebhookEvent" });

export type WebhookEvent = z.infer<typeof webhookEventSchema>;

const rejectionMessages = {
  invalid: "Enter a valid URL",
  insecure_scheme: "Webhook URLs must use https",
  credentials: "Webhook URLs must not contain credentials",
  private_host: "Webhook URLs must point at a public host",
} as const;

export const webhookUrlSchema = z
  .url({ protocol: /^https$/ })
  .max(2048)
  .superRefine((value, ctx) => {
    const rejection = URL.canParse(value)
      ? getWebhookUrlRejection(new URL(value))
      : "invalid";
    if (rejection) {
      ctx.addIssue({ code: "custom", message: rejectionMessages[rejection] });
    }
  });

export const createWebhookInputSchema = z.object({
  url: webhookUrlSchema,
  events: z.array(webhookEventTypeSchema).min(1),
});

export type CreateWebhookInput = z.infer<typeof createWebhookInputSchema>;

export const updateWebhookInputSchema = z.object({
  webhookId: z.string(),
  url: webhookUrlSchema.optional(),
  events: z.array(webhookEventTypeSchema).min(1).optional(),
  enabled: z.boolean().optional(),
});

export type UpdateWebhookInput = z.infer<typeof updateWebhookInputSchema>;
