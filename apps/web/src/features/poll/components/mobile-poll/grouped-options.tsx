import { cn } from "@rallly/ui";
import { groupBy } from "lodash";
import type * as React from "react";

import type { ParsedDateTimeOpton } from "@/lib/utils/date-time-utils";

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
            <div className={cn("sticky top-0 z-10 p-1", groupClassName)}>
              <div className="rounded-lg border bg-card/80 p-2 font-semibold text-sm shadow-sm backdrop-blur-lg">
                {day}
              </div>
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
