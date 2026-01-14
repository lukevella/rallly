import { z } from "@hono/zod-openapi";
import { isSupportedTimeZone } from "@/utils/supported-time-zones";

export const dateSchema = z.iso.date().openapi({
  description: "Date in YYYY-MM-DD format",
  example: "2025-12-23",
});

export const timeSchema = z.iso.time().openapi({
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
          "IANA timezone. If not provided, times will be stored as UTC and no timezone will be set on the poll (indicating floating times).",
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

export const createPollInputSchema = z
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
    requireEmail: z.boolean().optional().openapi({
      description: "Require participants to provide their email address",
      example: true,
    }),
    hideParticipants: z.boolean().optional().openapi({
      description: "Hide participant names from other participants",
      example: false,
    }),
    hideScores: z.boolean().optional().openapi({
      description: "Hide vote counts from participants",
      example: false,
    }),
    disableComments: z.boolean().optional().openapi({
      description: "Disable the comments section",
      example: false,
    }),
    spaceId: z.string().optional().openapi({
      description:
        "ID of the space to create the poll in. Defaults to user's most recently used space.",
      example: "space_abc123",
    }),
    organizer: z
      .object({
        email: z.email().openapi({
          description: "Email address of the organizer",
          example: "organizer@example.com",
        }),
      })
      .optional()
      .openapi({
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
  .openapi("CreatePollInput");

export const errorResponseSchema = z
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

export const deletePollSuccessResponseSchema = z
  .object({
    data: z.object({
      id: z.string().openapi({ example: "p_123abc" }),
      deleted: z.literal(true).openapi({ example: true }),
    }),
  })
  .openapi("DeletePollResponse");

export const pollStatusSchema = z
  .enum(["live", "paused", "finalized"])
  .openapi("PollStatus");

export const pollOptionSchema = z
  .object({
    id: z.string().openapi({ example: "opt_abc123" }),
    startTime: z.iso.datetime().openapi({ example: "2025-01-15T09:00:00Z" }),
    duration: z.number().int().openapi({
      description: "Duration in minutes. 0 indicates an all-day option.",
      example: 30,
    }),
  })
  .openapi("PollOption");

export const pollUserSchema = z
  .object({
    name: z.string().openapi({ example: "John Doe" }),
    image: z
      .string()
      .nullable()
      .openapi({ example: "https://example.com/avatar.jpg" }),
  })
  .openapi("PollUser");

export const getPollSuccessResponseSchema = z
  .object({
    data: z.object({
      id: z.string().openapi({ example: "p_123abc" }),
      title: z.string().openapi({ example: "Team sync" }),
      description: z.string().nullable().openapi({
        example: "Pick a time that works for everyone",
      }),
      location: z.string().nullable().openapi({ example: "Zoom" }),
      timezone: z.string().nullable().openapi({ example: "Europe/London" }),
      status: pollStatusSchema,
      createdAt: z
        .string()
        .datetime()
        .openapi({ example: "2025-01-10T12:00:00Z" }),
      user: pollUserSchema.nullable().openapi({
        description: "The poll organizer",
      }),
      options: z.array(pollOptionSchema),
      adminUrl: z
        .string()
        .openapi({ example: "https://example.com/poll/p_123abc" }),
      inviteUrl: z
        .string()
        .openapi({ example: "https://example.com/invite/p_123abc" }),
    }),
  })
  .openapi("GetPollResponse");

// Create poll returns the same shape as get poll
export const createPollSuccessResponseSchema =
  getPollSuccessResponseSchema.openapi("CreatePollResponse");

export const voteCountSchema = z
  .object({
    type: z.string().openapi({
      description: "The vote type (e.g., yes, ifNeedBe, no)",
      example: "yes",
    }),
    count: z.int().nonnegative().openapi({
      description: "Number of votes of this type",
      example: 5,
    }),
  })
  .openapi("VoteCount");

export const optionResultSchema = z
  .object({
    id: z.string().openapi({ example: "opt_abc123" }),
    startTime: z.iso.datetime().openapi({ example: "2025-01-15T09:00:00Z" }),
    duration: z.int().nonnegative().openapi({
      description: "Duration in minutes. 0 indicates an all-day option.",
      example: 30,
    }),
    votes: z.array(voteCountSchema).openapi({
      description: "Array of vote counts by type",
    }),
    score: z.int().nonnegative().openapi({
      description:
        "Ranking score: (yes + ifNeedBe) * 1000 + yes. Total availability is primary, yes votes break ties.",
      example: 5004,
    }),
    isTopChoice: z.boolean().openapi({
      description: "Whether this option has the highest score",
      example: true,
    }),
  })
  .openapi("OptionResult");

export const getPollResultsSuccessResponseSchema = z
  .object({
    data: z.object({
      pollId: z.string().openapi({ example: "p_123abc" }),
      participantCount: z.int().nonnegative().openapi({
        description: "Total number of participants",
        example: 8,
      }),
      options: z.array(optionResultSchema),
      highScore: z.int().nonnegative().openapi({
        description: "Highest score across all options",
        example: 7,
      }),
    }),
  })
  .openapi("GetPollResultsResponse");

export const participantSchema = z
  .object({
    id: z.string().openapi({ example: "participant_abc123" }),
    name: z.string().openapi({ example: "Jane Smith" }),
    email: z.string().nullable().openapi({ example: "jane@example.com" }),
    createdAt: z.iso.datetime().openapi({ example: "2025-01-10T12:00:00Z" }),
  })
  .openapi("Participant");

export const getPollParticipantsSuccessResponseSchema = z
  .object({
    data: z.object({
      pollId: z.string().openapi({ example: "p_123abc" }),
      participants: z.array(participantSchema),
    }),
  })
  .openapi("GetPollParticipantsResponse");
