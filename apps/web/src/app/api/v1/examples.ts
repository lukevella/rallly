import type * as z from "zod";
import type { createPollInputSchema, patchPollInputSchema } from "./schemas";

type CreatePollInput = z.input<typeof createPollInputSchema>;
type PatchPollInput = z.input<typeof patchPollInputSchema>;

export const createPollRequestExamples = {
  "Date poll": {
    summary: "Date poll (all-day options)",
    description:
      "Let participants pick between calendar days. Each option is one all-day date.",
    value: {
      title: "Team offsite",
      kind: "date",
      description: "Which days work for a two day offsite?",
      options: [
        { date: "2027-03-01" },
        { date: "2027-03-02" },
        { date: "2027-03-03" },
      ],
    } satisfies CreatePollInput,
  },
  "Time poll with explicit slots": {
    summary: "Time poll (explicit slots)",
    description:
      "Offer specific time slots. Datetimes without an offset are wall clock times in `timeZone`; this example offers 09:00 and 14:00 in London. Append `Z` or an offset for an absolute instant instead. A slot may override the poll's `duration`.",
    value: {
      title: "Project kickoff",
      kind: "time",
      location: "Zoom",
      timeZone: "Europe/London",
      duration: 60,
      options: [
        { startTime: "2027-03-01T09:00:00" },
        { startTime: "2027-03-01T14:00:00", duration: 90 },
      ],
    } satisfies CreatePollInput,
  },
  "Time poll with a slot generator": {
    summary: "Time poll (slot generator)",
    description:
      "Expand recurring slots across a date range. This example generates 30 minute slots at 09:00, 10:00 and 11:00 (New York time) every weekday from 1 to 5 March.",
    value: {
      title: "Interview availability",
      kind: "time",
      timeZone: "America/New_York",
      duration: 30,
      generators: [
        {
          startDate: "2027-03-01",
          endDate: "2027-03-05",
          days: ["mon", "tue", "wed", "thu", "fri"],
          from: "09:00",
          to: "12:00",
          interval: 60,
        },
      ],
    } satisfies CreatePollInput,
  },
  "Time poll mixing slots and a generator": {
    summary: "Time poll (explicit slots + generator)",
    description:
      "`options` and `generators` combine. When `interval` is omitted it defaults to `duration`, so this generator produces back to back 90 minute slots at 14:00 and 15:30 on Monday and Wednesday.",
    value: {
      title: "Product workshop",
      kind: "time",
      timeZone: "Europe/Berlin",
      duration: 90,
      options: [{ startTime: "2027-03-06T10:00:00" }],
      generators: [
        {
          startDate: "2027-03-08",
          endDate: "2027-03-10",
          days: ["mon", "wed"],
          from: "14:00",
          to: "17:00",
        },
      ],
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
