import { groupBy } from "lodash";
import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ParsedTimeSlotOption } from "utils/date-time-utils";

import { usePoll } from "@/components/poll-context";

import { ParticipantForm } from "../types";
import TimeSlotOption from "./time-slot-option";

export interface TimeSlotOptionsProps {
  options: ParsedTimeSlotOption[];
  editable?: boolean;
  selectedParticipantId?: string;
}

const TimeSlotOptions: React.VoidFunctionComponent<TimeSlotOptionsProps> = ({
  options,
  editable,
  selectedParticipantId,
}) => {
  const { control } = useFormContext<ParticipantForm>();
  const { getParticipantsWhoVotedForOption, getVote, getParticipantById } =
    usePoll();
  const selectedParticipant = selectedParticipantId
    ? getParticipantById(selectedParticipantId)
    : undefined;
  const grouped = groupBy(options, (option) => {
    return `${option.dow} ${option.day} ${option.month}`;
  });

  return (
    <div className="select-none divide-y">
      {Object.entries(grouped).map(([day, options]) => {
        return (
          <div key={day}>
            <div className="sticky top-24 z-10 flex border-b bg-gray-50/80 py-2 px-4 text-sm font-semibold text-indigo-500  shadow-sm backdrop-blur-md">
              {day}
            </div>
            <div className="divide-y">
              {options.map((option) => {
                const participants = getParticipantsWhoVotedForOption(
                  option.optionId,
                );
                return (
                  <Controller
                    key={option.optionId}
                    control={control}
                    name="votes"
                    render={({ field }) => {
                      const vote = editable
                        ? field.value.includes(option.optionId)
                          ? "yes"
                          : "no"
                        : selectedParticipant
                        ? getVote(selectedParticipant.id, option.optionId)
                        : undefined;

                      return (
                        <TimeSlotOption
                          onChange={(newVote) => {
                            if (!editable) {
                              return;
                            }
                            if (newVote === "no") {
                              field.onChange(
                                field.value.filter(
                                  (optionId) => optionId !== option.optionId,
                                ),
                              );
                            } else {
                              field.onChange([...field.value, option.optionId]);
                            }
                          }}
                          numberOfVotes={participants.length}
                          participants={participants}
                          vote={vote}
                          startTime={option.startTime}
                          endTime={option.endTime}
                          duration={option.duration}
                          editable={editable}
                          selectedParticipantId={selectedParticipant?.id}
                        />
                      );
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimeSlotOptions;
