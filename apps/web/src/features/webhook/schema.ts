import * as z from "zod";
import { pollClosedReasonSchema } from "@/features/poll/schema";
import { WEBHOOK_VERSION } from "./constants";
import { getWebhookUrlRejection } from "./utils";

export const webhookEventTypeSchema = z
  .enum([
    "poll.created",
    "poll.updated",
    "poll.closed",
    "poll.reopened",
    "poll.scheduled",
    "poll.deleted",
    "poll.participant.created",
    "poll.participant.updated",
    "poll.participant.deleted",
  ])
  .meta({
    id: "WebhookEventType",
    description: "The poll or participant change the event records.",
    example: "poll.closed",
  });

export type WebhookEventType = z.infer<typeof webhookEventTypeSchema>;

export const WEBHOOK_EVENT_TYPES = webhookEventTypeSchema.options;

export const webhookPollStatusSchema = z
  .enum(["open", "closed", "scheduled", "canceled"])
  .meta({ id: "WebhookPollStatus" });

export type WebhookPollStatus = z.infer<typeof webhookPollStatusSchema>;

const webhookPollFields = {
  id: z.string().meta({ example: "Xk3pQ9vLm2Ab" }),
  title: z.string().meta({ example: "Team sync" }),
  kind: z.enum(["date", "time"]).meta({ example: "time" }),
  timeZone: z.string().nullable().meta({ example: "Europe/London" }),
  adminUrl: z
    .string()
    .meta({ example: "https://app.rallly.co/poll/Xk3pQ9vLm2Ab" }),
  inviteUrl: z
    .string()
    .meta({ example: "https://rallly.co/invite/Xk3pQ9vLm2Ab" }),
};

/**
 * The poll as a status transition left it. Each variant is built once: a
 * registered `id` is global, so two schemas claiming the same one would
 * collide when the OpenAPI document is generated.
 */
const webhookPollAtSchema = (status: "open" | "closed" | "scheduled") =>
  z
    .object({
      ...webhookPollFields,
      status: z.literal(status).meta({
        description:
          "The status the transition moved the poll to. Reflects this event, not the poll's current state: a later transition arrives as its own event.",
      }),
    })
    .meta({ id: `WebhookPoll${status[0]?.toUpperCase()}${status.slice(1)}` });

const webhookPollOpenSchema = webhookPollAtSchema("open");
const webhookPollClosedSchema = webhookPollAtSchema("closed");
const webhookPollScheduledSchema = webhookPollAtSchema("scheduled");

/**
 * The poll for events that are not status transitions. The status is the
 * poll's own at the time the event was built, so it can be any value.
 */
const webhookPollSchema = z
  .object({
    ...webhookPollFields,
    status: webhookPollStatusSchema.meta({
      description:
        "The poll's status when the event was built. This event is not a status transition; those arrive as their own events.",
    }),
  })
  .meta({ id: "WebhookPoll" });

export const webhookParticipantSchema = z
  .object({
    id: z.string().meta({ example: "cm5h8x2k40000q9l4f7e2d3an" }),
    name: z.string().meta({ example: "Jessie Smith" }),
    email: z.string().nullable().meta({
      description:
        "Null when the participant did not leave one. Polls can require it with `requireParticipantEmail`.",
      example: "jessie@example.com",
    }),
    votes: z
      .array(
        z.object({
          optionId: z.string().meta({ example: "cm5h8x2k40000q9l4f7e2d3an" }),
          start: z.iso.datetime().meta({
            description:
              "The option's start. For `date` polls this is midnight UTC of the calendar date.",
            example: "2025-01-15T09:00:00.000Z",
          }),
          duration: z.int().nonnegative().meta({
            description: "Minutes. Zero for the options of a `date` poll.",
            example: 30,
          }),
          type: z.enum(["yes", "no", "ifNeedBe"]).meta({ example: "yes" }),
        }),
      )
      .meta({
        description:
          "The participant's votes as the event left them. Options the participant did not answer are absent. On `poll.participant.deleted` these are the votes that were removed.",
      }),
  })
  .meta({ id: "WebhookParticipant" });

const envelope = {
  version: z.string().meta({
    description:
      "The payload contract this event was built against. Also sent as the `X-Rallly-Webhook-Version` header.",
    example: WEBHOOK_VERSION,
  }),
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

export const pollCreatedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.created"),
    data: z.object({ poll: webhookPollOpenSchema }),
  })
  .meta({ id: "PollCreatedEvent" });

export const pollUpdatedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.updated"),
    data: z.object({ poll: webhookPollSchema }),
  })
  .meta({
    id: "PollUpdatedEvent",
    description:
      "The poll's details, options or settings changed. The event carries the poll as it stands, not what changed: fetch the poll to see its current state.",
  });

export const pollClosedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.closed"),
    data: z.object({
      poll: webhookPollClosedSchema,
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
    data: z.object({ poll: webhookPollOpenSchema }),
  })
  .meta({ id: "PollReopenedEvent" });

export const pollScheduledEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.scheduled"),
    data: z.object({
      poll: webhookPollScheduledSchema,
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

export const pollDeletedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.deleted"),
    data: z.object({ poll: webhookPollSchema }),
  })
  .meta({
    id: "PollDeletedEvent",
    description:
      "The poll was deleted. Its `adminUrl` and `inviteUrl` no longer resolve; they are kept so every event carries the same poll shape.",
  });

const participantEventData = z.object({
  poll: webhookPollSchema,
  participant: webhookParticipantSchema,
});

export const pollParticipantCreatedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.participant.created"),
    data: participantEventData,
  })
  .meta({ id: "PollParticipantCreatedEvent" });

export const pollParticipantUpdatedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.participant.updated"),
    data: participantEventData,
  })
  .meta({
    id: "PollParticipantUpdatedEvent",
    description: "The participant changed their votes or their name.",
  });

export const pollParticipantDeletedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.participant.deleted"),
    data: participantEventData,
  })
  .meta({ id: "PollParticipantDeletedEvent" });

export const webhookEventSchema = z
  .discriminatedUnion("type", [
    pollCreatedEventSchema,
    pollUpdatedEventSchema,
    pollClosedEventSchema,
    pollReopenedEventSchema,
    pollScheduledEventSchema,
    pollDeletedEventSchema,
    pollParticipantCreatedEventSchema,
    pollParticipantUpdatedEventSchema,
    pollParticipantDeletedEventSchema,
  ])
  .meta({ id: "WebhookEvent" });

export type WebhookEvent = z.infer<typeof webhookEventSchema>;

const rejectionMessages = {
  invalid: "Enter a valid URL",
  insecure_scheme: "Webhook URLs must use https",
  credentials: "Webhook URLs must not contain credentials",
  private_host: "Webhook URLs must point at a public host",
} as const;

/**
 * The scheme is judged by the refinement below, not by `z.url`'s own
 * `protocol` option: a failing built-in check adds its generic "Invalid URL"
 * issue ahead of the specific one, and a form resolver shows only the first.
 * One source of verdicts means the field always names the actual problem.
 */
export const webhookUrlSchema = z
  .url()
  .max(2048)
  .superRefine((value, ctx) => {
    const rejection = URL.canParse(value)
      ? getWebhookUrlRejection(new URL(value))
      : "invalid";
    if (rejection) {
      ctx.addIssue({ code: "custom", message: rejectionMessages[rejection] });
    }
  });

// Cap on endpoints per space. Not a security control — the dispatcher fans
// out to every enabled endpoint, so this bounds the work one space can add
// to a run, and keeps the list readable.
export const MAX_WEBHOOKS_PER_SPACE = 5;

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

export const setWebhookEnabledSchema = z.object({
  webhookId: z.string(),
  enabled: z.boolean(),
});

export const deleteWebhookSchema = z.object({
  webhookId: z.string(),
});
