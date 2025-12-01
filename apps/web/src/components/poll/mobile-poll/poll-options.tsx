import type { VoteType } from "@rallly/database";
import dayjs from "dayjs";
import * as React from "react";
import { Controller } from "react-hook-form";
import { useVotingForm } from "@/components/poll/voting-form";
import { usePoll } from "@/components/poll-context";
import type { ParsedDateTimeOpton } from "@/utils/date-time-utils";
import { DateGroupWithNone } from "./date-group-with-none";
import DateOption from "./date-option";
import TimeSlotOption from "./time-slot-option";

export interface PollOptions {
  options: ParsedDateTimeOpton[];
  editable?: boolean;
  selectedParticipantId?: string;
}

const PollOptions: React.FunctionComponent<PollOptions> = ({
  options,
  editable,
  selectedParticipantId,
}) => {
  const { control } = useVotingForm();
  const {
    getParticipantsWhoVotedForOption,
    getParticipantById,
    getScore,
    getVote,
    optionIds,
  } = usePoll();
  const selectedParticipant = selectedParticipantId
    ? getParticipantById(selectedParticipantId)
    : undefined;

  const hasTimeSlots = React.useMemo(
    () => options.some((opt) => opt.type === "timeSlot"),
    [options],
  );

  const groupedByDate = React.useMemo(() => {
    if (!hasTimeSlots) return null;

    const groups = new Map<string, ParsedDateTimeOpton[]>();
    for (const option of options) {
      if (option.type === "timeSlot") {
        const dateKey = dayjs(option.startTime).format("YYYY-MM-DD");
        const existing = groups.get(dateKey) || [];
        groups.set(dateKey, [...existing, option]);
      }
    }
    return groups;
  }, [hasTimeSlots, options]);

  if (hasTimeSlots && groupedByDate && editable) {
    return (
      <div className="divide-y">
        {Array.from(groupedByDate.entries()).map(([dateKey, dateOptions]) => {
          const firstOption = dateOptions[0];
          const dateLabel =
            firstOption?.type === "timeSlot"
              ? dayjs(firstOption.startTime).format("dddd, LL")
              : "";
          return (
            <Controller
              key={dateKey}
              control={control}
              name="votes"
              render={({ field }) => {
                const handleVotesChange = (
                  optionIds: string[],
                  type: VoteType,
                ) => {
                  const newValue = [...field.value];
                  for (const optionId of optionIds) {
                    const index = optionIds.findIndex((id) => id === optionId);
                    if (index !== -1) {
                      newValue[index] = { optionId, type };
                    }
                  }
                  field.onChange(newValue);
                };

                return (
                  <DateGroupWithNone
                    dateLabel={dateLabel}
                    options={dateOptions}
                    votes={field.value}
                    onVotesChange={handleVotesChange}
                    editable={editable}
                  >
                    {dateOptions.map((option) => {
                      if (option.type !== "timeSlot") return null;

                      const participants = getParticipantsWhoVotedForOption(
                        option.optionId,
                      );
                      const score = getScore(option.optionId);
                      const index = optionIds.findIndex(
                        (optionId) => option.optionId === optionId,
                      );
                      const vote =
                        !editable && selectedParticipant
                          ? getVote(selectedParticipant.id, option.optionId)
                          : field.value[index]?.type;

                      const handleChange = (newVote: VoteType) => {
                        if (!editable) return;
                        const newValue = [...field.value];
                        newValue[index] = {
                          optionId: option.optionId,
                          type: newVote,
                        };
                        field.onChange(newValue);
                      };

                      return (
                        <TimeSlotOption
                          key={option.optionId}
                          onChange={handleChange}
                          optionId={option.optionId}
                          yesScore={score.yes}
                          ifNeedBeScore={score.ifNeedBe}
                          participants={participants}
                          vote={vote}
                          startTime={option.startTime}
                          endTime={option.endTime}
                          duration={option.duration}
                          editable={editable}
                          selectedParticipantId={selectedParticipant?.id}
                        />
                      );
                    })}
                  </DateGroupWithNone>
                );
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="divide-y">
      {options.map((option) => {
        const participants = getParticipantsWhoVotedForOption(option.optionId);
        const score = getScore(option.optionId);
        const index = optionIds.findIndex(
          (optionId) => option.optionId === optionId,
        );
        return (
          <Controller
            key={option.optionId}
            control={control}
            name="votes"
            render={({ field }) => {
              const vote =
                !editable && selectedParticipant
                  ? getVote(selectedParticipant.id, option.optionId)
                  : field.value[index]?.type;

              const handleChange = (newVote: VoteType) => {
                if (!editable) {
                  return;
                }
                const newValue = [...field.value];
                newValue[index] = { optionId: option.optionId, type: newVote };
                field.onChange(newValue);
              };

              switch (option.type) {
                case "timeSlot":
                  return (
                    <TimeSlotOption
                      onChange={handleChange}
                      optionId={option.optionId}
                      yesScore={score.yes}
                      ifNeedBeScore={score.ifNeedBe}
                      participants={participants}
                      vote={vote}
                      startTime={option.startTime}
                      endTime={option.endTime}
                      duration={option.duration}
                      editable={editable}
                      selectedParticipantId={selectedParticipant?.id}
                    />
                  );
                case "date":
                  return (
                    <DateOption
                      onChange={handleChange}
                      optionId={option.optionId}
                      yesScore={score.yes}
                      ifNeedBeScore={score.ifNeedBe}
                      participants={participants}
                      vote={vote}
                      dow={option.dow}
                      day={option.day}
                      month={option.month}
                      editable={editable}
                      selectedParticipantId={selectedParticipant?.id}
                    />
                  );
              }
            }}
          />
        );
      })}
    </div>
  );
};

export default PollOptions;
