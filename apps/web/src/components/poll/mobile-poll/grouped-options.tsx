import { cn } from "@rallly/ui";
import type * as React from "react";

import type { ParsedDateTimeOpton } from "@/utils/date-time-utils";

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
  const grouped = options.reduce<Record<string, ParsedDateTimeOpton[]>>(
    (acc, option) => {
      const key = group(option);
      acc[key] = acc[key] ?? [];
      acc[key].push(option);
      return acc;
    },
    {},
  );
  return (
    <div className="select-none divide-y">
      {Object.entries(grouped).map(([day, options]) => {
        return (
          <div key={day}>
            <div
              className={cn(
                "flex border-b bg-muted px-4 py-2 font-medium text-xs uppercase",
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
