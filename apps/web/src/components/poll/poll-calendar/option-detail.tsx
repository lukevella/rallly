"use client";

import { useOptions } from "@/components/poll-context";
import { Trans } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";
import type { ParsedDateTimeOpton } from "@/utils/date-time-utils";

import PollOptions from "../mobile-poll/poll-options";
import { ConnectedScoreSummary } from "../score-summary";
import { VoteSummary } from "../vote-summary";
import { useVotingForm } from "../voting-form";
import type { CalendarOption } from "./use-poll-calendar";

/**
 * Detail for a selected day. When the voting form is idle it shows each option's
 * availability score and the full who-voted-what breakdown (read-only results).
 * While answering it reuses the mobile poll options so votes can be cast — click
 * a row to cycle yes → ifNeedBe → no — keeping voting identical everywhere.
 */
export function DayDetail({
  dayKey,
  options,
}: {
  dayKey: string;
  options: CalendarOption[];
}) {
  const date = dayjs(`${dayKey}T12:00:00`);
  const votingForm = useVotingForm();
  const isEditing = votingForm.watch("mode") !== "view";
  const selectedParticipantId = votingForm.watch("participantId");
  const { options: parsedOptions } = useOptions();

  const heading = (
    <h3 className="mb-3 font-semibold text-sm">{date.format("dddd, LL")}</h3>
  );

  if (isEditing) {
    const parsedById = new Map<string, ParsedDateTimeOpton>();
    for (const o of parsedOptions) {
      parsedById.set(o.optionId, o);
    }
    const dayOptions = options.flatMap((option) => {
      const parsed = parsedById.get(option.optionId);
      return parsed ? [parsed] : [];
    });

    return (
      <div>
        {heading}
        <div className="overflow-hidden rounded-lg border">
          <PollOptions
            options={dayOptions}
            editable
            selectedParticipantId={selectedParticipantId}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {heading}
      <div className="divide-y overflow-hidden rounded-lg border">
        {options.map((option) => (
          <div key={option.optionId} className="space-y-3 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-sm">
                {option.duration > 0 ? (
                  `${option.start.format("LT")} – ${option.end.format("LT")}`
                ) : (
                  <Trans i18nKey="allDay" defaults="All day" />
                )}
              </div>
              <ConnectedScoreSummary optionId={option.optionId} />
            </div>
            <VoteSummary optionId={option.optionId} />
          </div>
        ))}
      </div>
    </div>
  );
}
