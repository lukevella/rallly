import * as z from "zod";
import { pollClosedReasonSchema } from "@/features/activity/schema";
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

/**
 * Events reference the poll, they do not describe it: every other poll
 * field is either derivable, or mutable and stale by the time a retry lands,
 * and `GET /polls/{pollId}` returns the current truth in one call. The
 * participant is carried in full for the opposite reason: nothing in the
 * API returns a participant's availability.
 */
export const webhookPollRefSchema = z
  .object({
    id: z.string().meta({
      description:
        "The poll's id. Fetch `GET /polls/{pollId}` for its title, options, settings and current status.",
      example: "Xk3pQ9vLm2Ab",
    }),
  })
  .meta({ id: "WebhookPollRef" });

/**
 * The span of time a poll was scheduled as. There is no option id and no
 * poll `kind`: the span is the fact, and `allDay` says all a receiver needs
 * about its kind.
 */
const timeRangeFields = {
  start: z.iso.datetime().meta({
    description: "Start of the span, inclusive, as a UTC instant.",
    example: "2025-01-15T09:00:00.000Z",
  }),
  end: z.iso.datetime().meta({
    description:
      "End of the span, exclusive, as a UTC instant: a 30 minute slot starting at 09:00 ends at 09:30, and the instant 09:30 is not in it.",
    example: "2025-01-15T09:30:00.000Z",
  }),
  allDay: z.boolean().meta({
    description:
      "True for a whole calendar day. The day is a floating date with no timezone, given as `start` at 00:00:00Z on that date and `end` at 00:00:00Z on the next; read the date from `start` and ignore the time of day.",
    example: false,
  }),
};

export const webhookScheduledEventSchema = z
  .object(timeRangeFields)
  .meta({ id: "WebhookScheduledEvent" });

/**
 * Events reference the participant the same way they reference the poll:
 * by id. Fetch `GET /polls/{pollId}/participants` for the rest.
 */
export const webhookParticipantRefSchema = z
  .object({
    id: z.string().meta({
      description:
        "The participant's id. Fetch `GET /polls/{pollId}/participants` for their details. After `poll.participant.deleted` the participant is no longer listed.",
      example: "cm5h8x2k40000q9l4f7e2d3an",
    }),
  })
  .meta({ id: "WebhookParticipantRef" });

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
    data: z.object({ poll: webhookPollRefSchema }),
  })
  .meta({
    id: "PollCreatedEvent",
    description:
      "A poll was created in the space, from the app or the API. It starts open.",
  });

export const pollUpdatedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.updated"),
    data: z.object({ poll: webhookPollRefSchema }),
  })
  .meta({
    id: "PollUpdatedEvent",
    description:
      "The poll's details, options or settings changed. The event says that something changed, not what: fetch the poll for its current state.",
  });

export const pollClosedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.closed"),
    data: z.object({
      poll: webhookPollRefSchema,
      reason: pollClosedReasonSchema.meta({
        description:
          "`manual` when the organizer closed the poll, `auto` when it closed because every option had passed.",
      }),
    }),
  })
  .meta({
    id: "PollClosedEvent",
    description:
      "The poll stopped accepting responses, either because the organizer closed it or because every option had passed. Reopening arrives as `poll.reopened`; scheduling arrives as `poll.scheduled`, not as a close.",
  });

export const pollReopenedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.reopened"),
    data: z.object({ poll: webhookPollRefSchema }),
  })
  .meta({
    id: "PollReopenedEvent",
    description: "A closed poll accepts responses again.",
  });

export const pollScheduledEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.scheduled"),
    data: z.object({
      poll: webhookPollRefSchema,
      event: webhookScheduledEventSchema.meta({
        description: "The calendar event the poll was scheduled as.",
      }),
    }),
  })
  .meta({
    id: "PollScheduledEvent",
    description:
      "The organizer picked a time. The poll stops accepting responses and `data.event` is the span that was chosen.",
  });

export const pollDeletedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.deleted"),
    data: z.object({ poll: webhookPollRefSchema }),
  })
  .meta({
    id: "PollDeletedEvent",
    description:
      "The poll was deleted. `GET /polls/{pollId}` returns 404 from now on, so anything you need about it must already be stored.",
  });

const participantEventData = z.object({
  poll: webhookPollRefSchema,
  participant: webhookParticipantRefSchema,
});

export const pollParticipantCreatedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.participant.created"),
    data: participantEventData,
  })
  .meta({
    id: "PollParticipantCreatedEvent",
    description: "Someone responded to the poll.",
  });

export const pollParticipantUpdatedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.participant.updated"),
    data: participantEventData,
  })
  .meta({
    id: "PollParticipantUpdatedEvent",
    description: "The participant changed their response or their name.",
  });

export const pollParticipantDeletedEventSchema = z
  .object({
    ...envelope,
    type: z.literal("poll.participant.deleted"),
    data: participantEventData,
  })
  .meta({
    id: "PollParticipantDeletedEvent",
    description:
      "A response was removed, by the participant or the organizer. `data.participant` is a reference to the removed response; fetching it returns 404.",
  });

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
