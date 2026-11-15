import { cn } from "@rallly/ui";
import type * as React from "react";

import type { ParsedPlaceOption } from "@/features/poll/components/poll-context";
import type { ParsedDateTimeOpton } from "@/lib/utils/date-time-utils";

type GroupableOption = ParsedDateTimeOpton | ParsedPlaceOption;

import PollOptions from "./poll-options";

export interface GroupedOptionsProps {
  options: GroupableOption[];
  editable?: boolean;
  selectedParticipantId?: string;
  group: (option: GroupableOption) => string;
  groupClassName?: string;
}

const GroupedOptions: React.FunctionComponent<GroupedOptionsProps> = ({
  options,
  editable,
  selectedParticipantId,
  group,
  groupClassName,
}) => {
  const grouped = new Map<string, GroupableOption[]>();
  for (const option of options) {
    const key = group(option);
    const list = grouped.get(key);
    if (list) {
      list.push(option);
    } else {
      grouped.set(key, [option]);
    }
  }
  return (
    <div className="select-none divide-y">
      {Array.from(grouped, ([day, options]) => {
        return (
          <div key={day}>
            <div
              className={cn(
                "border-b bg-card/80 px-4 py-3 font-semibold text-sm",
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
