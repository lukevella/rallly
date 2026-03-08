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
import {
  curatedTimezoneIds,
  getAllTimezoneIds,
  getCityFromTimezoneId,
} from "@/components/time-zone-picker/timezone-data";
import { useTranslation } from "@/i18n/client";

const allIds = getAllTimezoneIds().sort((a, b) =>
  getCityFromTimezoneId(a).localeCompare(getCityFromTimezoneId(b)),
);

const curatedIds = allIds.filter((id) => curatedTimezoneIds.has(id));

function filterTimezone(id: string, query: string): boolean {
  if (!query) return true;
  return getCityFromTimezoneId(id).toLowerCase().includes(query.toLowerCase());
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

  return (
    <Combobox
      items={isSearching ? allIds : curatedIds}
      value={value ?? null}
      onValueChange={(id) => {
        if (id) {
          onValueChange?.(id);
        }
      }}
      onInputValueChange={(inputValue, { reason }) => {
        if (reason === "input-change") {
          setIsSearching(inputValue.trim().length > 0);
        } else {
          setIsSearching(false);
        }
      }}
      itemToStringLabel={getCityFromTimezoneId}
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
          {(entry, index) => (
            <ComboboxItem key={entry} value={entry} index={index}>
              <span className="min-w-0 flex-1 truncate">
                {getCityFromTimezoneId(entry)}
              </span>
              <span className="rounded-full px-1 py-0.5 text-center text-muted-foreground text-xs tabular-nums">
                {dayjs().tz(entry).format("LT")}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
