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
import { useTranslation } from "@/i18n/client";
import type { TimezoneEntryWithOffset } from "./timezone-utils";
import { getTimezoneEntriesWithOffset } from "./timezone-utils";

function filterTimezone(
  entry: TimezoneEntryWithOffset,
  query: string,
): boolean {
  if (!query) return entry.curated;
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
  const allEntries = React.useMemo(() => getTimezoneEntriesWithOffset(), []);
  const curatedList = React.useMemo(
    () => allEntries.filter((e) => e.curated),
    [allEntries],
  );

  const [isSearching, setIsSearching] = React.useState(false);
  const selectedEntry = React.useMemo(
    () => allEntries.find((e) => e.id === value),
    [allEntries, value],
  );

  return (
    <Combobox<TimezoneEntryWithOffset>
      items={isSearching ? allEntries : curatedList}
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
      <div ref={anchorRef}>
        <ComboboxInput
          className={cn("min-w-64", className)}
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
      <ComboboxContent anchor={anchorRef.current}>
        <ComboboxEmpty>
          {t("timeZoneSelect__noOption", {
            defaultValue: "No timezone found",
          })}
        </ComboboxEmpty>
        <ComboboxList>
          {(entry) => (
            <ComboboxItem key={entry.id} value={entry} index={entry.index}>
              <span className="min-w-0 flex-1 truncate">{entry.city}</span>
              <span className="rounded-full px-1 py-0.5 text-center font-mono text-muted-foreground text-xs">
                {dayjs().tz(entry.id).format("LT")}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
