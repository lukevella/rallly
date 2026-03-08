import { cn } from "@rallly/ui";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@rallly/ui/combobox";
import { InputGroupAddon } from "@rallly/ui/input-group";
import dayjs from "dayjs";
import { GlobeIcon } from "lucide-react";
import React from "react";
import type { TimezoneEntry } from "@/components/time-zone-picker/timezone-data";
import {
  allTimezoneEntries,
  curatedTimezoneEntries,
} from "@/components/time-zone-picker/timezone-data";
import { getOffsetLabel } from "@/components/time-zone-picker/timezone-utils";
import { useTranslation } from "@/i18n/client";

function filterTimezone(entry: TimezoneEntry, query: string): boolean {
  if (!query) return true;
  return entry.keywords.includes(query.toLowerCase());
}

export function TimeZoneSelect({
  value,
  onValueChange,
  className,
  disabled,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  const anchorRef = useComboboxAnchor();

  const [isSearching, setIsSearching] = React.useState(false);

  const selectedEntry = React.useMemo(
    () => allTimezoneEntries.find((e) => e.id === value),
    [value],
  );

  return (
    <Combobox<TimezoneEntry>
      items={isSearching ? allTimezoneEntries : curatedTimezoneEntries}
      value={selectedEntry ?? null}
      onValueChange={(entry) => {
        if (entry) {
          onValueChange?.(entry.id);
        }
      }}
      onInputValueChange={(inputValue, { reason }) => {
        if (reason === "input-change") {
          setIsSearching(inputValue.trim().length > 0);
        } else {
          setIsSearching(false);
        }
      }}
      itemToStringLabel={(entry) => entry.city}
      filter={filterTimezone}
      autoHighlight={true}
    >
      <div ref={anchorRef} className={cn("min-w-64", className)}>
        <ComboboxInput
          disabled={disabled}
          placeholder={t("timezoneInputPlaceholder", {
            defaultValue: "Search timezone…",
          })}
        >
          <InputGroupAddon>
            <GlobeIcon />
          </InputGroupAddon>
        </ComboboxInput>
      </div>
      <ComboboxContent align="end" anchor={anchorRef.current}>
        <ComboboxEmpty>
          {t("timeZoneSelect__noOption", {
            defaultValue: "No timezone found",
          })}
        </ComboboxEmpty>
        <ComboboxList>
          {(entry) => (
            <ComboboxItem key={entry.id} value={entry} index={entry.index}>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground text-xs tabular-nums">
                {getOffsetLabel(entry.id)}
              </span>
              <span className="min-w-0 flex-1 truncate">{entry.city}</span>
              <span className="rounded-full px-1 py-0.5 text-center text-muted-foreground text-xs tabular-nums">
                {dayjs().tz(entry.id).format("LT")}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
