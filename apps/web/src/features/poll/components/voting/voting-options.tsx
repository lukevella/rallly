"use client";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import * as React from "react";
import { usePoll as usePollDetails } from "@/features/poll/client";
import { usePoll as usePollScores } from "@/features/poll/components/poll-context";
import { ConnectedScoreSummary } from "@/features/poll/components/score-summary";
import { IfScoresVisible } from "@/features/poll/components/visibility";
import { VoteBreakdownDialog } from "@/features/poll/components/vote-breakdown-dialog";
import VoteIcon from "@/features/poll/components/vote-icon";
import { VoteSegmentedControl } from "@/features/poll/components/vote-segmented-control";
import { useVotingForm } from "@/features/poll/components/voting-form";
import type { VoteType } from "@/features/poll/constants";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans, useTranslation } from "@/i18n/client";
import { CalendarDate } from "@/lib/datetime/calendar-date";
import { useDateTime } from "@/lib/datetime/client";

function VoteBreakdownButton({
  optionId,
  optionLabel,
}: {
  optionId: string;
  optionLabel: string;
}) {
  const { t } = useTranslation();
  const { getScore, poll } = usePollScores();
  const { yes, ifNeedBe } = getScore(optionId);
  const dialog = useDialog();
  const breakdown = poll.allowTentativeVotes
    ? t("optionVoteBreakdown", {
        defaultValue: "{yesScore} yes, {ifNeedBeScore} if need be",
        yesScore: yes,
        ifNeedBeScore: ifNeedBe,
      })
    : t("optionVoteBreakdownYesOnly", {
        defaultValue: "{yesScore} yes",
        yesScore: yes,
      });

  return (
    <IfScoresVisible>
      <Button
        {...dialog.triggerProps}
        variant="ghost"
        size="sm"
        aria-label={`${breakdown}. ${t("showParticipantVotes", {
          defaultValue: "Show participant votes",
        })}`}
      >
        <ConnectedScoreSummary optionId={optionId} />
      </Button>
      <VoteBreakdownDialog
        {...dialog.dialogProps}
        optionId={optionId}
        optionLabel={optionLabel}
      />
    </IfScoresVisible>
  );
}

function VoteLabel({ type }: { type?: VoteType }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <VoteIcon type={type} />
      {type === "yes" ? (
        <Trans i18nKey="yes" defaults="Yes" />
      ) : type === "ifNeedBe" ? (
        <Trans i18nKey="ifNeedBe" defaults="If need be" />
      ) : type === "no" ? (
        <Trans i18nKey="no" defaults="No" />
      ) : (
        <Trans i18nKey="pending" defaults="Pending" />
      )}
    </span>
  );
}

type PollOption = { id: string; startTime: Date; duration: number };

function VotingOptionRow({
  option,
  label,
  optionLabel,
  editable,
  vote,
  onChange,
}: {
  option: PollOption;
  label: React.ReactNode;
  /** Full date (and time) as text, for the vote control and dialog. */
  optionLabel: string;
  editable: boolean;
  vote?: VoteType;
  onChange: (vote: VoteType) => void;
}) {
  const poll = usePollDetails();

  return (
    // Scroll margins keep a keyboard-focused row clear of the sticky bars.
    <li
      data-testid="poll-option"
      className="flex scroll-mt-16 scroll-mb-20 items-center gap-4 px-4 py-2"
    >
      <span className="flex-1 whitespace-nowrap text-sm">{label}</span>
      <VoteBreakdownButton optionId={option.id} optionLabel={optionLabel} />
      {editable ? (
        <VoteSegmentedControl
          value={vote}
          onChange={onChange}
          optionLabel={optionLabel}
          allowTentativeVotes={poll.allowTentativeVotes}
        />
      ) : vote !== undefined ? (
        <VoteLabel type={vote} />
      ) : null}
    </li>
  );
}

const endOf = (option: PollOption) =>
  new Date(option.startTime.getTime() + option.duration * 60_000);

export function VotingOptions() {
  const poll = usePollDetails();
  const { getVote, optionIds } = usePollScores();
  const { formatDateTime, formatDateTimeRange } = useDateTime();
  const votingForm = useVotingForm();
  const mode = votingForm.watch("mode");
  const votes = votingForm.watch("votes");
  const participantId = votingForm.watch("participantId");
  const editable = mode !== "view";
  const headingId = React.useId();

  const isTimeSlot = (poll.options[0]?.duration ?? 0) > 0;
  // All-day dates and floating times are stored as UTC wall time and read
  // back in UTC; a zoned time poll is read in the viewer's zone.
  const readZone = isTimeSlot && poll.timeZone ? undefined : "UTC";

  // Rows group by day (time polls) or month (date polls) in the viewer's
  // zone, so the key is the formatted heading.
  const groups = new Map<string, PollOption[]>();
  for (const option of poll.options) {
    const key = formatDateTime(
      option.startTime,
      isTimeSlot ? "dateFull" : "monthYear",
      { timeZone: readZone },
    );
    groups.set(key, [...(groups.get(key) ?? []), option]);
  }

  return (
    <div className="flex-1">
      {Array.from(groups, ([key, groupOptions], groupIndex) => {
        const id = `${headingId}-${groupIndex}`;
        const first = groupOptions[0];
        return (
          <section key={key} aria-labelledby={id}>
            <h3
              id={id}
              className="border-b bg-muted/50 px-4 py-2 font-medium text-sm"
            >
              {isTimeSlot ? (
                <EventDate
                  value={first.startTime}
                  allDay={false}
                  timeZone={poll.timeZone}
                  preset="dateFull"
                />
              ) : (
                <CalendarDate value={first.startTime} preset="monthYear" />
              )}
            </h3>
            <ul className="divide-y">
              {groupOptions.map((option) => {
                const index = optionIds.indexOf(option.id);
                const vote = editable
                  ? votes[index]?.type
                  : participantId
                    ? getVote(participantId, option.id)
                    : undefined;
                const optionLabel = isTimeSlot
                  ? `${key}, ${formatDateTimeRange(
                      option.startTime,
                      endOf(option),
                      "time",
                      { timeZone: readZone },
                    )}`
                  : formatDateTime(option.startTime, "dateFull", {
                      timeZone: "UTC",
                    });
                return (
                  <VotingOptionRow
                    key={option.id}
                    option={option}
                    label={
                      isTimeSlot ? (
                        <EventTimeRange
                          start={option.startTime}
                          end={endOf(option)}
                          allDay={false}
                          timeZone={poll.timeZone}
                        />
                      ) : (
                        <CalendarDate
                          value={option.startTime}
                          preset="weekdayDay"
                        />
                      )
                    }
                    optionLabel={optionLabel}
                    editable={editable}
                    vote={vote}
                    onChange={(newVote) => {
                      const next = [...votes];
                      next[index] = { optionId: option.id, type: newVote };
                      votingForm.setValue("votes", next, {
                        shouldDirty: true,
                      });
                    }}
                  />
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
