import clsx from "clsx";
import { groupBy } from "lodash";
import * as React from "react";

import { ParsedDateTimeOpton } from "@/utils/date-time-utils";

import PollOptions from "./poll-options";

export interface GroupedOptionsProps {
  options: ParsedDateTimeOpton[];
  editable?: boolean;
  selectedParticipantId?: string;
  group: (option: ParsedDateTimeOpton) => string;
  groupClassName?: string;
}

const GroupedOptions: React.FunctionComponent<GroupedOptionsProps> = ({
  options,
  editable,
  selectedParticipantId,
  group,
  groupClassName,
}) => {
  const grouped = groupBy(options, group);
  return (
    <div className="select-none divide-y">
      {Object.entries(grouped).map(([day, options]) => {
        return (
          <div key={day}>
            <div
              className={clsx(
                "flex border-b bg-gray-50 px-4 py-2 text-sm font-semibold",
                groupClassName,
              )}
            >
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

export default GroupedOptions;
