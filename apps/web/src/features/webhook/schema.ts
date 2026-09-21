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

/**
 * An option in the shape the API's poll resource uses, so an id or a date
 * seen here matches what a follow-up API call returns. Which shape applies
 * is given by the poll's `kind` in the same event.
 */
export const webhookOptionSchema = z
  .union([
    z.object({
      id: z.string().meta({ example: "cm5h8x2k40000q9l4f7e2d3an" }),
      date: z.iso.date().meta({ example: "2025-01-15" }),
    }),
    z.object({
      id: z.string().meta({ example: "cm5h8x2k40000q9l4f7e2d3an" }),
      startTime: z.iso.datetime().meta({ example: "2025-01-15T09:00:00.000Z" }),
      duration: z.int().positive().meta({ example: 30 }),
    }),
  ])
  .meta({
    id: "WebhookOption",
    description:
      "Its shape follows the poll's `kind`: a date for `date` polls, a start time and duration for `time` polls.",
  });

/**
 * A participant's response as availability: the ranges they can make, each
 * with open-ended modifiers. Absence means unavailable, as in a free/busy
 * listing, so a consumer that does not know a modifier still reads the
 * range correctly as available.
 */
export const webhookAvailabilitySchema = z
  .object({
    start: z.iso.datetime().meta({ example: "2025-01-15T09:00:00.000Z" }),
    end: z.iso.datetime().meta({ example: "2025-01-15T09:30:00.000Z" }),
    allDay: z.boolean().meta({
      description:
        "True for the options of a `date` poll: the range is a floating calendar day, given as midnight to midnight UTC.",
      example: false,
    }),
    modifiers: z.array(z.string()).meta({
      description:
        "Qualifiers on the availability. `ifNeedBe` means the participant can make it but would rather not. New modifiers may be added without a version change; an unknown one still leaves the range available.",
      example: ["ifNeedBe"],
    }),
  })
  .meta({ id: "WebhookAvailability" });

export const webhookParticipantSchema = z
  .object({
    id: z.string().meta({ example: "cm5h8x2k40000q9l4f7e2d3an" }),
    name: z.string().meta({ example: "Jessie Smith" }),
    email: z.string().nullable().meta({
      description:
        "Null when the participant did not leave one. Polls can require it with `requireParticipantEmail`.",
      example: "jessie@example.com",
    }),
    availability: z.array(webhookAvailabilitySchema).meta({
      description:
        "When the participant is available, one range per option they can make, in start order. Options they cannot make, or did not answer, are absent. Adjacent ranges are not merged. On `poll.participant.deleted` this is the availability that was removed.",
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
      option: webhookOptionSchema,
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
