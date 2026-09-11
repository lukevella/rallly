import type * as z from "zod";
import type { createPollInputSchema, patchPollInputSchema } from "./schemas";

type CreatePollInput = z.input<typeof createPollInputSchema>;
type PatchPollInput = z.input<typeof patchPollInputSchema>;

export const createPollRequestExamples = {
  "Date poll": {
    summary: "Date poll (all-day options)",
    description:
      "Let participants pick between calendar days. Each date becomes an all-day option.",
    value: {
      title: "Team offsite",
      description: "Which days work for a two day offsite?",
      options: {
        kind: "date",
        dates: ["2027-03-01", "2027-03-02", "2027-03-03"],
      },
    } satisfies CreatePollInput,
  },
  "Time poll with explicit times": {
    summary: "Time poll (explicit times)",
    description:
      "Offer specific time slots. Datetimes without an offset are interpreted as wall-clock in `timeZone` — this example offers 09:00 and 14:00 in London. Append `Z` or an offset to specify an absolute instant instead.",
    value: {
      title: "Project kickoff",
      location: "Zoom",
      options: {
        kind: "time",
        duration: 60,
        timeZone: "Europe/London",
        times: ["2027-03-01T09:00:00", "2027-03-01T14:00:00"],
      },
    } satisfies CreatePollInput,
  },
  "Time poll with a slot generator": {
    summary: "Time poll (slot generator)",
    description:
      "Expand recurring slots across a date range. This example generates 30 minute slots at 09:00, 10:00 and 11:00 (New York time) every weekday from 1 to 5 March.",
    value: {
      title: "Interview availability",
      options: {
        kind: "time",
        duration: 30,
        timeZone: "America/New_York",
        generators: [
          {
            startDate: "2027-03-01",
            endDate: "2027-03-05",
            days: ["mon", "tue", "wed", "thu", "fri"],
            startTime: "09:00",
            endTime: "12:00",
            interval: 60,
          },
        ],
      },
    } satisfies CreatePollInput,
  },
  "Time poll mixing times and a generator": {
    summary: "Time poll (explicit times + generator)",
    description:
      "`times` and `generators` combine. When `interval` is omitted it defaults to `duration`, so this generator produces back to back 90 minute slots at 14:00 and 15:30 on Monday and Wednesday.",
    value: {
      title: "Product workshop",
      options: {
        kind: "time",
        duration: 90,
        timeZone: "Europe/Berlin",
        times: ["2027-03-06T10:00:00"],
        generators: [
          {
            startDate: "2027-03-08",
            endDate: "2027-03-10",
            days: ["mon", "wed"],
            startTime: "14:00",
            endTime: "17:00",
          },
        ],
      },
    } satisfies CreatePollInput,
  },
};

export const patchPollRequestExamples = {
  "Close the poll": {
    summary: "Close a poll",
    description:
      "Set `status` to `closed` once you have picked a date or no longer need the poll. Closing is idempotent and makes the results final.",
    value: {
      status: "closed",
    } satisfies PatchPollInput,
  },
};
