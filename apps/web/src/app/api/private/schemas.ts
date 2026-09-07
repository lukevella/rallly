import * as z from "zod";
import { MAX_SLOT_GENERATION_DAYS } from "@/lib/datetime/slot-generator";
import { timezoneSchema } from "@/lib/utils/timezone-schema";

export const dateSchema = z.iso.date().meta({
  description: "Date in YYYY-MM-DD format",
  example: "2025-12-23",
});

export const timeSchema = z.iso.time().meta({
  description: "Time in HH:mm (24-hour) format",
  example: "09:30",
});

export const slotGeneratorSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
    days: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])),
    startTime: timeSchema,
    endTime: timeSchema,
    interval: z.number().int().min(15).max(1440).optional().meta({
      description: "Interval in minutes between slots. Defaults to duration.",
      example: 30,
    }),
  })
  // Reject over-long ranges up front rather than silently truncating at the
  // generator's MAX_SLOT_GENERATION_DAYS cap.
  .refine(
    (data) => {
      const start = Date.parse(data.startDate);
      const end = Date.parse(data.endDate);
      const spanDays = (end - start) / (1000 * 60 * 60 * 24);
      return spanDays >= 0 && spanDays < MAX_SLOT_GENERATION_DAYS;
    },
    {
      message: `The date range must span fewer than ${MAX_SLOT_GENERATION_DAYS} days, with endDate on or after startDate.`,
      path: ["endDate"],
    },
  )
  .meta({ id: "SlotGenerator" });

const slotsInputSchema = z
  .object({
    duration: z.number().int().min(15).max(1440).meta({
      description: "Duration in minutes for each time slot",
      example: 30,
    }),
    timezone: timezoneSchema.optional().meta({
      description:
        "IANA timezone. Datetime strings without an offset are interpreted in this timezone. If omitted, offset-less datetimes are treated as floating times (no timezone conversion) and the poll has no timezone set.",
      example: "Europe/London",
    }),
    times: z
      .array(
        z.union([
          z.iso.datetime({ local: true, offset: true }).meta({
            description:
              "ISO datetime start time. Strings without an offset are interpreted as wall-clock in `timezone` (e.g. `2025-01-15T09:00:00` with `timezone: Europe/London` means 09:00 in London). Strings with an offset or `Z` are treated as absolute instants.",
            example: "2025-01-15T09:00:00",
          }),
          slotGeneratorSchema,
        ]),
      )
      .min(1)
      .meta({
        description:
          "Times to include. An array of ISO datetime strings and/or slot generators.",
      }),
  })
  .meta({ id: "SlotsInput" });

const datesInputSchema = z
  .array(z.iso.date())
  .min(1)
  .meta({
    description: "Array of ISO dates for all-day options",
    example: ["2025-01-15", "2025-01-16", "2025-01-17"],
  });

export const createPollInputSchema = z
  .object({
    title: z.string().trim().min(1).meta({ example: "Team sync" }),
    description: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .meta({ example: "Pick a time that works for everyone" }),
    location: z.string().trim().max(255).optional().meta({ example: "Zoom" }),
    requireEmail: z.boolean().optional().meta({
      description: "Require participants to provide their email address",
      example: true,
    }),
    hideParticipants: z.boolean().optional().meta({
      description: "Hide participant names from other participants",
      example: false,
    }),
    hideScores: z.boolean().optional().meta({
      description: "Hide vote counts from participants",
      example: false,
    }),
    disableComments: z.boolean().optional().meta({
      description:
        "Disable the comments section. Defaults to true: new polls have comments disabled unless this is set to false.",
      example: false,
    }),
    spaceId: z.string().optional().meta({
      description:
        "ID of the space to create the poll in. Defaults to user's most recently used space.",
      example: "space_abc123",
    }),
    organizer: z
      .object({
        email: z.email().meta({
          description: "Email address of the organizer",
          example: "organizer@example.com",
        }),
      })
      .optional()
      .meta({
        description:
          "Organizer of the poll. Defaults to the space owner if not provided. The organizer must be a member of the space.",
      }),
    dates: datesInputSchema.optional(),
    slots: slotsInputSchema.optional(),
  })
  .refine((data) => data.dates || data.slots, {
    message: "Either 'dates' or 'slots' must be provided",
  })
  .refine((data) => !(data.dates && data.slots), {
    message: "Cannot provide both 'dates' and 'slots'",
  })
  .meta({ id: "CreatePollInput" });

export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().meta({ example: "TIMEZONE_REQUIRED" }),
      message: z.string().meta({
        example:
          "Timezone is required. Either provide a timezone in the request or set one in your profile.",
      }),
    }),
  })
  .meta({ id: "ErrorResponse" });

export const deletePollSuccessResponseSchema = z
  .object({
    data: z.object({
      id: z.string().meta({ example: "p_123abc" }),
      deleted: z.literal(true).meta({ example: true }),
    }),
  })
  .meta({ id: "DeletePollResponse" });

export const pollStatusSchema = z
  .enum(["open", "closed", "scheduled", "canceled"])
  .meta({ id: "PollStatus" });

export const pollOptionSchema = z
  .object({
    id: z.string().meta({ example: "opt_abc123" }),
    startTime: z.iso.datetime().meta({ example: "2025-01-15T09:00:00Z" }),
    duration: z.number().int().meta({
      description: "Duration in minutes. 0 indicates an all-day option.",
      example: 30,
    }),
  })
  .meta({ id: "PollOption" });

export const pollUserSchema = z
  .object({
    name: z.string().meta({ example: "John Doe" }),
    image: z
      .string()
      .nullable()
      .meta({ example: "https://example.com/avatar.jpg" }),
  })
  .meta({ id: "PollUser" });

const pollSchema = z
  .object({
    id: z.string().meta({ example: "p_123abc" }),
    title: z.string().meta({ example: "Team sync" }),
    description: z.string().nullable().meta({
      example: "Pick a time that works for everyone",
    }),
    location: z.string().nullable().meta({ example: "Zoom" }),
    timezone: z.string().nullable().meta({ example: "Europe/London" }),
    status: pollStatusSchema,
    createdAt: z.string().datetime().meta({ example: "2025-01-10T12:00:00Z" }),
    user: pollUserSchema.nullable().meta({
      description: "The poll organizer",
    }),
    options: z.array(pollOptionSchema),
    adminUrl: z.string().meta({ example: "https://example.com/poll/p_123abc" }),
    inviteUrl: z
      .string()
      .meta({ example: "https://example.com/invite/p_123abc" }),
  })
  .meta({ id: "Poll" });

export const getPollSuccessResponseSchema = z
  .object({
    data: pollSchema,
  })
  .meta({ id: "GetPollResponse" });

export const patchPollInputSchema = z
  .object({
    status: pollStatusSchema.meta({
      description:
        "The status to transition the poll to. Only `closed` is currently accepted; the other statuses are reserved for future transitions.",
      example: "closed",
    }),
  })
  .meta({ id: "PatchPollInput" });

// Updating a poll returns the same shape as get poll
export const patchPollSuccessResponseSchema = getPollSuccessResponseSchema.meta(
  { id: "PatchPollResponse" },
);

// Create poll returns the same shape as get poll
export const createPollSuccessResponseSchema =
  getPollSuccessResponseSchema.meta({ id: "CreatePollResponse" });

export const listPollsQuerySchema = z.object({
  status: pollStatusSchema.optional().meta({
    description: "Filter polls by status. Omit to include all statuses.",
    example: "open",
  }),
  cursor: z.string().optional().meta({
    description:
      "Cursor for pagination. Pass the `nextCursor` value from the previous response to fetch the next page.",
    example: "p_123abc",
  }),
  limit: z.coerce.number().int().min(1).max(100).default(20).meta({
    description: "Number of polls to return per page (1-100).",
    example: 20,
  }),
});

export const listPollItemSchema = pollSchema
  .extend({
    participantCount: z.int().nonnegative().meta({
      description: "Number of participants who have responded to the poll",
      example: 3,
    }),
  })
  .meta({ id: "ListPollItem" });

export const listPollsSuccessResponseSchema = z
  .object({
    data: z.array(listPollItemSchema),
    nextCursor: z.string().nullable().meta({
      description:
        "Cursor to fetch the next page. `null` when there are no more results.",
      example: "p_123abc",
    }),
  })
  .meta({ id: "ListPollsResponse" });

export const voteCountSchema = z
  .object({
    type: z.string().meta({
      description: "The vote type (e.g., yes, ifNeedBe, no)",
      example: "yes",
    }),
    count: z.int().nonnegative().meta({
      description: "Number of votes of this type",
      example: 5,
    }),
  })
  .meta({ id: "VoteCount" });

export const optionResultSchema = z
  .object({
    id: z.string().meta({ example: "opt_abc123" }),
    startTime: z.iso.datetime().meta({ example: "2025-01-15T09:00:00Z" }),
    duration: z.int().nonnegative().meta({
      description: "Duration in minutes. 0 indicates an all-day option.",
      example: 30,
    }),
    votes: z.array(voteCountSchema).meta({
      description: "Array of vote counts by type",
    }),
    score: z.int().nonnegative().meta({
      description:
        "Ranking score: (yes + ifNeedBe) * 1000 + yes. Total availability is primary, yes votes break ties.",
      example: 5004,
    }),
    isTopChoice: z.boolean().meta({
      description: "Whether this option has the highest score",
      example: true,
    }),
  })
  .meta({ id: "OptionResult" });

export const getPollResultsSuccessResponseSchema = z
  .object({
    data: z.object({
      pollId: z.string().meta({ example: "p_123abc" }),
      status: pollStatusSchema.meta({
        description:
          "Current poll status. Polls close automatically when all options are in the past.",
        example: "open",
      }),
      participantCount: z.int().nonnegative().meta({
        description: "Total number of participants",
        example: 8,
      }),
      options: z.array(optionResultSchema),
      highScore: z.int().nonnegative().meta({
        description: "Highest score across all options",
        example: 7,
      }),
    }),
  })
  .meta({ id: "GetPollResultsResponse" });

export const participantSchema = z
  .object({
    id: z.string().meta({ example: "participant_abc123" }),
    name: z.string().meta({ example: "Jane Smith" }),
    email: z.string().nullable().meta({ example: "jane@example.com" }),
    createdAt: z.iso.datetime().meta({ example: "2025-01-10T12:00:00Z" }),
  })
  .meta({ id: "Participant" });

export const getPollParticipantsSuccessResponseSchema = z
  .object({
    data: z.object({
      pollId: z.string().meta({ example: "p_123abc" }),
      participants: z.array(participantSchema),
    }),
  })
  .meta({ id: "GetPollParticipantsResponse" });
