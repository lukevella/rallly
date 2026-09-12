import * as z from "zod";
import { MAX_POLL_TITLE_LENGTH } from "@/features/poll/schema";
import { MAX_SLOT_GENERATION_DAYS } from "@/lib/datetime/slot-generator";
import { timezoneSchema } from "@/lib/utils/timezone-schema";

export const dateSchema = z.iso.date().meta({
  description: "Date in YYYY-MM-DD format",
  example: "2027-03-01",
});

export const timeSchema = z.iso.time({ precision: -1 }).meta({
  description: "Time in HH:mm (24-hour) format",
  example: "09:30",
});

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type Weekday = (typeof WEEKDAYS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

const daySpan = (startDate: string, endDate: string) =>
  (Date.parse(endDate) - Date.parse(startDate)) / DAY_MS;

// A calendar date has the same weekday in every zone, so no zone is needed.
const rangeIncludesWeekday = (
  startDate: string,
  endDate: string,
  days: ReadonlyArray<Weekday>,
) => {
  const wanted = new Set(days.map((day) => WEEKDAYS.indexOf(day)));
  const start = Date.parse(startDate);
  const span = daySpan(startDate, endDate);
  for (let offset = 0; offset <= Math.min(span, 6); offset++) {
    // getUTCDay: 0 = Sunday; WEEKDAYS starts on Monday.
    const weekday = (new Date(start + offset * DAY_MS).getUTCDay() + 6) % 7;
    if (wanted.has(weekday)) return true;
  }
  return false;
};

const minutesOfDay = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const durationSchema = z.number().int().min(15).max(1440);

export const slotGeneratorSchema = z
  .strictObject({
    startDate: dateSchema.meta({
      description: "First day of the range to generate slots on, inclusive.",
      example: "2027-03-01",
    }),
    endDate: dateSchema.meta({
      description:
        "Last day of the range, inclusive. The range must span fewer than 366 days.",
      example: "2027-03-05",
    }),
    days: z
      .array(z.enum(WEEKDAYS))
      .min(1)
      .default([...WEEKDAYS])
      .meta({
        description:
          "Days of the week to generate slots on. Days in the range that are not listed are skipped. Defaults to every day.",
        example: ["mon", "tue", "wed", "thu", "fri"],
      }),
    from: timeSchema.meta({
      description:
        "Earliest slot start on each day, as a wall clock time in `timeZone`.",
      example: "09:00",
    }),
    to: timeSchema.meta({
      description:
        "End of the daily window, as a wall clock time in `timeZone`. A slot is only generated if it ends at or before this time.",
      example: "17:00",
    }),
    interval: durationSchema.optional().meta({
      description:
        "Minutes between consecutive slot starts. Defaults to `duration`, which produces back to back slots.",
      example: 60,
    }),
  })
  // Reject over-long ranges up front rather than silently truncating at the
  // generator's MAX_SLOT_GENERATION_DAYS cap.
  .refine(
    (data) => {
      const span = daySpan(data.startDate, data.endDate);
      return span >= 0 && span < MAX_SLOT_GENERATION_DAYS;
    },
    {
      message: `The date range must span fewer than ${MAX_SLOT_GENERATION_DAYS} days, with endDate on or after startDate.`,
      path: ["endDate"],
    },
  )
  .refine((data) => minutesOfDay(data.to) > minutesOfDay(data.from), {
    message: "Must be later than `from`. Windows cannot cross midnight.",
    path: ["to"],
  })
  .refine(
    (data) =>
      daySpan(data.startDate, data.endDate) < 0 ||
      rangeIncludesWeekday(data.startDate, data.endDate, data.days),
    {
      message: "None of the listed days fall between startDate and endDate.",
      path: ["days"],
    },
  )
  .meta({
    id: "SlotGenerator",
    title: "Slot generator",
    description:
      "Expands into one slot of `duration` minutes every `interval` minutes between `from` and `to`, on each listed day of the week between `startDate` and `endDate`. Slots that would not end by `to` are not generated.",
  });

const dateOptionInputSchema = z
  .strictObject({
    date: dateSchema.meta({
      description: "Calendar day to offer, as a floating `YYYY-MM-DD` date.",
      example: "2027-03-01",
    }),
  })
  .meta({
    id: "DateOptionInput",
    title: "Date option",
    description: "One all-day option. The same shape `DateOption` returns.",
  });

const timeOptionInputSchema = z
  .strictObject({
    startTime: z.iso.datetime({ local: true, offset: true }).meta({
      description:
        "ISO datetime start time. A string without an offset is wall clock time in `timeZone` when that is set (`2027-03-01T09:00:00` with `timeZone: Europe/London` means 09:00 in London) and a floating time with no conversion otherwise. A string with an offset or `Z` is an absolute instant.",
      example: "2027-03-01T09:00:00",
    }),
    duration: durationSchema.optional().meta({
      description:
        "Length of this slot in minutes. Defaults to the poll's `duration`.",
      example: 30,
    }),
  })
  .meta({
    id: "TimeOptionInput",
    title: "Time option",
    description: "One time slot. The same shape `TimeOption` returns.",
  });

const pollSettingsFields = {
  title: z
    .string()
    .trim()
    .min(1)
    .max(MAX_POLL_TITLE_LENGTH)
    .meta({ example: "Team sync" }),
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
  allowTentativeVotes: z.boolean().optional().meta({
    description:
      'Allow participants to answer "if need be" as well as yes and no. Defaults to true.',
    example: true,
  }),
  organizer: z
    .strictObject({
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
};

// Strict so a misspelt or unsupported field fails loudly instead of being
// silently ignored.
const createDatePollInputSchema = z
  .strictObject({
    title: pollSettingsFields.title,
    kind: z.literal("date").meta({
      description: "Participants vote on whole days.",
    }),
    description: pollSettingsFields.description,
    location: pollSettingsFields.location,
    requireEmail: pollSettingsFields.requireEmail,
    hideParticipants: pollSettingsFields.hideParticipants,
    hideScores: pollSettingsFields.hideScores,
    disableComments: pollSettingsFields.disableComments,
    allowTentativeVotes: pollSettingsFields.allowTentativeVotes,
    organizer: pollSettingsFields.organizer,
    options: z.array(dateOptionInputSchema).min(1).meta({
      description:
        "Calendar days to offer. Dates are floating calendar days with no timezone, so never convert them through one. Duplicates are removed.",
    }),
  })
  .meta({ id: "CreateDatePollInput", title: "Date poll" });

const createTimePollInputSchema = z
  .strictObject({
    title: pollSettingsFields.title,
    kind: z.literal("time").meta({
      description: "Participants vote on time slots.",
    }),
    description: pollSettingsFields.description,
    location: pollSettingsFields.location,
    requireEmail: pollSettingsFields.requireEmail,
    hideParticipants: pollSettingsFields.hideParticipants,
    hideScores: pollSettingsFields.hideScores,
    disableComments: pollSettingsFields.disableComments,
    allowTentativeVotes: pollSettingsFields.allowTentativeVotes,
    organizer: pollSettingsFields.organizer,
    timeZone: timezoneSchema.optional().meta({
      description:
        "IANA time zone the times are written in. Datetime strings without an offset are interpreted in this zone. If omitted, offset-less datetimes are floating times (no conversion) and the poll has no time zone.",
      example: "Europe/London",
    }),
    duration: durationSchema.optional().meta({
      description:
        "Default slot length in minutes. Required when `generators` is set or an option omits its own `duration`.",
      example: 30,
    }),
    options: z.array(timeOptionInputSchema).min(1).optional().meta({
      description:
        "Explicit slots. Provide `options`, `generators` or both. Duplicates are removed.",
    }),
    generators: z.array(slotGeneratorSchema).min(1).optional().meta({
      description:
        "Slot generators. Each expands into recurring slots from a schedule and the result is appended to `options`.",
    }),
  })
  // These rules do not survive JSON Schema conversion; the field
  // descriptions state them instead.
  .superRefine((data, ctx) => {
    if (!data.options && !data.generators) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Provide `options`, `generators` or both.",
      });
    }
    if (data.duration === undefined) {
      data.options?.forEach((option, index) => {
        if (option.duration === undefined) {
          ctx.addIssue({
            code: "custom",
            path: ["options", index, "duration"],
            message: "Required when the poll has no default `duration`.",
          });
        }
      });
      if (data.generators) {
        ctx.addIssue({
          code: "custom",
          path: ["duration"],
          message: "Required when `generators` is set.",
        });
      }
      return;
    }
    const { duration } = data;
    data.generators?.forEach((generator, index) => {
      const window = minutesOfDay(generator.to) - minutesOfDay(generator.from);
      if (window > 0 && window < duration) {
        ctx.addIssue({
          code: "custom",
          path: ["generators", index, "to"],
          message: `The window from ${generator.from} to ${generator.to} is shorter than the ${duration} minute duration.`,
        });
      }
    });
  })
  .meta({ id: "CreateTimePollInput", title: "Time poll" });

export const createPollInputSchema = z
  .discriminatedUnion(
    "kind",
    [createDatePollInputSchema, createTimePollInputSchema],
    {
      error: 'kind must be "date" or "time"',
    },
  )
  .meta({
    id: "CreatePollInput",
    description:
      "`kind` chooses what participants vote on: whole days (`date`) or time slots (`time`). The request mirrors the poll the API returns: the same settings, and `options` in the same shape as the response.",
    discriminator: {
      propertyName: "kind",
      mapping: {
        date: "#/components/schemas/CreateDatePollInput",
        time: "#/components/schemas/CreateTimePollInput",
      },
    },
  });

export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().meta({
        description:
          "Machine-readable error code. The full list is in the API description.",
        example: "VALIDATION_ERROR",
      }),
      message: z.string().meta({
        description:
          "Human-readable explanation. For `VALIDATION_ERROR` it names each offending field, e.g. `title: Invalid input: expected string, received undefined; dates.0: Invalid ISO date`.",
        example: "title: Invalid input: expected string, received undefined",
      }),
    }),
  })
  .meta({ id: "ErrorResponse" });

export const deletePollSuccessResponseSchema = z
  .object({
    data: z.object({
      id: z.string().meta({ example: "Xk3pQ9vLm2Ab" }),
      deleted: z.literal(true).meta({ example: true }),
    }),
  })
  .meta({ id: "DeletePollResponse" });

export const pollStatusSchema = z
  .enum(["open", "closed", "scheduled", "canceled"])
  .meta({ id: "PollStatus" });

export const pollKindSchema = z.enum(["date", "time"]).meta({
  id: "PollKind",
  description:
    "Whether the poll offers calendar dates (`date`) or time slots (`time`). Determines which option shape the poll uses: every option in a `date` poll has a `date`, every option in a `time` poll has a `startTime` and `duration`.",
  example: "time",
});

export const dateOptionSchema = z
  .object({
    id: z.string().meta({ example: "cm5h8x2k40000q9l4f7e2d3an" }),
    date: z.iso.date().meta({
      description:
        "Calendar date in YYYY-MM-DD format. All-day options are floating dates with no time component and no timezone.",
      example: "2025-01-15",
    }),
  })
  .meta({
    id: "DateOption",
    description: "An all-day option. Only present in polls with `kind: date`.",
  });

export const timeOptionSchema = z
  .object({
    id: z.string().meta({ example: "cm5h8x2k40000q9l4f7e2d3an" }),
    startTime: z.iso.datetime().meta({
      description: "Start of the slot as an ISO 8601 instant in UTC.",
      example: "2025-01-15T09:00:00.000Z",
    }),
    duration: z.int().positive().meta({
      description: "Duration in minutes.",
      example: 30,
    }),
  })
  .meta({
    id: "TimeOption",
    description: "A time slot. Only present in polls with `kind: time`.",
  });

export const pollOptionSchema = z
  .union([dateOptionSchema, timeOptionSchema])
  .meta({
    id: "PollOption",
    description:
      "A poll option. The shape follows the poll's `kind`: a `DateOption` for `date` polls, a `TimeOption` for `time` polls.",
  });

export const pollOrganizerSchema = z
  .object({
    id: z.string().meta({ example: "cm3f7d1qa0000t2k9c6b8h4jr" }),
    name: z.string().meta({ example: "John Doe" }),
    email: z.email().meta({ example: "organizer@example.com" }),
    image: z.string().nullable().meta({
      example: "https://cdn.rallly.co/avatars/cm3f7d1qa0000t2k9c6b8h4jr.jpg",
    }),
  })
  .meta({ id: "PollOrganizer" });

const pollSchema = z
  .object({
    id: z.string().meta({ example: "Xk3pQ9vLm2Ab" }),
    title: z.string().meta({ example: "Team sync" }),
    description: z.string().nullable().meta({
      example: "Pick a time that works for everyone",
    }),
    location: z.string().nullable().meta({ example: "Zoom" }),
    timeZone: z.string().nullable().meta({ example: "Europe/London" }),
    status: pollStatusSchema,
    kind: pollKindSchema,
    createdAt: z.iso.datetime().meta({ example: "2025-01-10T12:00:00.000Z" }),
    updatedAt: z.iso.datetime().meta({
      description:
        "When the poll was last modified. Changes when the poll's details, settings or status change.",
      example: "2025-01-12T08:30:00.000Z",
    }),
    organizer: pollOrganizerSchema.nullable().meta({
      description:
        "The space member the poll belongs to. `null` when the organizer's account no longer exists.",
    }),
    requireEmail: z.boolean().meta({
      description: "Whether participants must provide their email address",
      example: false,
    }),
    hideParticipants: z.boolean().meta({
      description:
        "Whether participant names are hidden from other participants",
      example: false,
    }),
    hideScores: z.boolean().meta({
      description: "Whether vote counts are hidden from participants",
      example: false,
    }),
    disableComments: z.boolean().meta({
      description: "Whether the comments section is disabled",
      example: true,
    }),
    allowTentativeVotes: z.boolean().meta({
      description:
        'Whether participants may cast the tentative "if need be" vote',
      example: true,
    }),
    participantCount: z.int().nonnegative().meta({
      description: "Number of participants who have responded to the poll",
      example: 3,
    }),
    options: z.array(pollOptionSchema),
    adminUrl: z
      .string()
      .meta({ example: "https://app.rallly.co/poll/Xk3pQ9vLm2Ab" }),
    inviteUrl: z
      .string()
      .meta({ example: "https://rallly.co/invite/Xk3pQ9vLm2Ab" }),
  })
  .meta({ id: "Poll" });

export const pollResponseSchema = z
  .object({
    data: pollSchema,
  })
  .meta({ id: "PollResponse" });

export const patchPollInputSchema = z
  .strictObject({
    status: pollStatusSchema.meta({
      description:
        "The status to transition the poll to. Only `closed` is currently accepted; the other statuses are reserved for future transitions.",
      example: "closed",
    }),
  })
  .meta({ id: "PatchPollInput" });

export const listPollsQuerySchema = z.object({
  status: pollStatusSchema.optional().meta({
    description: "Filter polls by status. Omit to include all statuses.",
    example: "open",
  }),
  cursor: z.string().optional().meta({
    description:
      "Cursor for pagination. Pass the `nextCursor` value from the previous response to fetch the next page.",
    example: "Xk3pQ9vLm2Ab",
  }),
  limit: z.coerce.number().int().min(1).max(100).default(20).meta({
    description: "Number of polls to return per page (1-100).",
    example: 20,
  }),
});

export const listPollsSuccessResponseSchema = z
  .object({
    data: z.array(pollSchema),
    nextCursor: z.string().nullable().meta({
      description:
        "Cursor to fetch the next page. `null` when there are no more results.",
      example: "Xk3pQ9vLm2Ab",
    }),
  })
  .meta({ id: "ListPollsResponse" });

// Open enum: the response schema accepts any string so a vote type added
// later never fails serialization. The built-in set is documented, not enforced.
export const voteTypeSchema = z.string().meta({
  id: "VoteType",
  description:
    "A participant's answer for an option. The built-in types are `yes` (available), `ifNeedBe` (available if needed) and `no` (unavailable). New types may be added without a version change, so treat unknown values as a vote of an unfamiliar type rather than an error.",
  example: "yes",
});

export const voteCountSchema = z
  .object({
    type: voteTypeSchema,
    count: z.int().nonnegative().meta({
      description: "Number of participants who gave this answer.",
      example: 3,
    }),
  })
  .meta({ id: "VoteCount" });

const optionResultFields = {
  votes: z.array(voteCountSchema).meta({
    description:
      "One entry per vote type the poll offers, in display order, always present with `count: 0` when nobody chose it.",
  }),
  score: z.int().nonnegative().meta({
    description:
      "Opaque ranking value: higher is better. Only comparable between options in the same response. The formula is not part of the contract and may change; do not decode it into vote counts, compare it across polls or threshold on it. Use `votes` for counts.",
    example: 5004,
  }),
  isTopChoice: z.boolean().meta({
    description:
      "Whether this option has the highest `score` in the poll. Several options share the flag when they tie. Always `false` when nobody has voted.",
    example: true,
  }),
};

export const dateOptionResultSchema = dateOptionSchema
  .extend(optionResultFields)
  .meta({
    id: "DateOptionResult",
    description:
      "Results for an all-day option. Only present in polls with `kind: date`.",
  });

export const timeOptionResultSchema = timeOptionSchema
  .extend(optionResultFields)
  .meta({
    id: "TimeOptionResult",
    description:
      "Results for a time slot. Only present in polls with `kind: time`.",
  });

export const optionResultSchema = z
  .union([dateOptionResultSchema, timeOptionResultSchema])
  .meta({
    id: "OptionResult",
    description:
      "Results for one option. The shape follows the poll's `kind`: a `DateOptionResult` for `date` polls, a `TimeOptionResult` for `time` polls.",
  });

export const getPollResultsSuccessResponseSchema = z
  .object({
    data: z.object({
      pollId: z.string().meta({ example: "Xk3pQ9vLm2Ab" }),
      kind: pollKindSchema,
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
        description:
          "The highest `score` among the options. Opaque like `score`: use it to identify the leading options, not as a measurement.",
        example: 5004,
      }),
    }),
  })
  .meta({ id: "GetPollResultsResponse" });

export const participantVoteSchema = z
  .object({
    optionId: z.string().meta({ example: "cm5h8x2k40000q9l4f7e2d3an" }),
    type: voteTypeSchema,
  })
  .meta({ id: "ParticipantVote" });

export const participantSchema = z
  .object({
    id: z.string().meta({ example: "cm5j2r8wb0003q9l4a1x6p0zt" }),
    name: z.string().meta({ example: "Jane Smith" }),
    email: z.string().nullable().meta({ example: "jane@example.com" }),
    createdAt: z.iso.datetime().meta({ example: "2025-01-10T12:00:00.000Z" }),
    votes: z.array(participantVoteSchema).meta({
      description:
        "The participant's vote for each option, keyed by `optionId`. An option missing from the list has no recorded vote from this participant.",
    }),
  })
  .meta({ id: "Participant" });

export const listParticipantsQuerySchema = z.object({
  cursor: z.string().optional().meta({
    description:
      "Cursor for pagination. Pass the `nextCursor` value from the previous response to fetch the next page.",
    example: "cm5j2r8wb0003q9l4a1x6p0zt",
  }),
  limit: z.coerce.number().int().min(1).max(100).default(50).meta({
    description: "Number of participants to return per page (1-100).",
    example: 50,
  }),
});

export const getPollParticipantsSuccessResponseSchema = z
  .object({
    data: z.array(participantSchema),
    nextCursor: z.string().nullable().meta({
      description:
        "Cursor to fetch the next page. `null` when there are no more results.",
      example: "cm5j2r8wb0003q9l4a1x6p0zt",
    }),
  })
  .meta({ id: "GetPollParticipantsResponse" });
