import { groupBy } from "lodash";
import * as React from "react";
import { ParsedTimeSlotOption } from "utils/date-time-utils";

import PollOptions from "./poll-options";

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
  const grouped = groupBy(options, (option) => {
    return `${option.dow} ${option.day} ${option.month}`;
  });

  return (
    <div className="select-none divide-y">
      {Object.entries(grouped).map(([day, options]) => {
        return (
          <div key={day}>
            <div className="sticky top-[105px] z-10 flex border-b bg-gray-50/80 py-2 px-4 text-sm font-semibold shadow-sm backdrop-blur-md">
              {day}
            </div>
            <PollOptions
              options={options}
              editable={editable}
              selectedParticipantId={selectedParticipantId}
            />
          </div>
        );
      })}
    </div>
  );
};

export default TimeSlotOptions;
