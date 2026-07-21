import type * as z from "zod";
import type { createPollInputSchema } from "./schemas";

type CreatePollInput = z.input<typeof createPollInputSchema>;

export const createPollRequestExamples = {
  datePoll: {
    summary: "Date poll (all-day options)",
    description:
      "Use `dates` to let participants pick between calendar days. Each date becomes an all-day option.",
    value: {
      title: "Team offsite",
      description: "Which days work for a two day offsite?",
      dates: ["2026-08-03", "2026-08-04", "2026-08-05"],
    } satisfies CreatePollInput,
  },
  timePoll: {
    summary: "Time poll (explicit times)",
    description:
      "Use `slots` with ISO datetime strings to offer specific time slots. Times are UTC and displayed to participants in the poll's `timezone`.",
    value: {
      title: "Project kickoff",
      location: "Zoom",
      slots: {
        duration: 60,
        timezone: "Europe/London",
        times: [
          "2026-08-03T09:00:00Z",
          "2026-08-03T14:00:00Z",
          "2026-08-04T09:00:00Z",
        ],
      },
    } satisfies CreatePollInput,
  },
  slotGenerator: {
    summary: "Time poll (slot generator)",
    description:
      "Use a slot generator to expand recurring slots across a date range. This example generates 30 minute slots at 09:00, 10:00 and 11:00 (New York time) every weekday between 3-7 August.",
    value: {
      title: "Interview availability",
      slots: {
        duration: 30,
        timezone: "America/New_York",
        times: [
          {
            startDate: "2026-08-03",
            endDate: "2026-08-07",
            days: ["mon", "tue", "wed", "thu", "fri"],
            startTime: "09:00",
            endTime: "12:00",
            interval: 60,
          },
        ],
      },
    } satisfies CreatePollInput,
  },
  mixedTimes: {
    summary: "Time poll (explicit times + generator)",
    description:
      "`slots.times` can mix ISO datetime strings and slot generators. When `interval` is omitted it defaults to `duration`, so this generator produces back to back 90 minute slots at 14:00 and 15:30 on Monday and Wednesday.",
    value: {
      title: "Product workshop",
      slots: {
        duration: 90,
        timezone: "Europe/Berlin",
        times: [
          "2026-08-01T10:00:00Z",
          {
            startDate: "2026-08-03",
            endDate: "2026-08-05",
            days: ["mon", "wed"],
            startTime: "14:00",
            endTime: "17:00",
          },
        ],
      },
    } satisfies CreatePollInput,
  },
};
