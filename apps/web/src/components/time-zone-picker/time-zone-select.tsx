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
import { GlobeIcon } from "lucide-react";
import React from "react";
import {
  getAllTimezoneIds,
  getCityFromTimezoneId,
  getCuratedTimezoneIds,
  matchesTimezoneQuery,
} from "@/components/time-zone-picker/timezone-data";
import { useTranslation } from "@/i18n/client";
import { Time } from "@/lib/datetime/time";
import {
  normalizeLegacyIanaId,
  toRuntimeCanonicalIanaId,
} from "@/lib/utils/timezone-schema";

const allIds = getAllTimezoneIds().sort((a, b) =>
  getCityFromTimezoneId(a).localeCompare(getCityFromTimezoneId(b)),
);

const curatedIds = getCuratedTimezoneIds(allIds);

const idByCanonicalForm = new Map(
  allIds.map((id) => [toRuntimeCanonicalIanaId(id), id]),
);

/**
 * Map a stored ID onto the exact item the list renders.
 *
 * Values are persisted in the modern spelling (`timezoneSchema` normalizes on
 * write), while the runtime lists the legacy one. Passing the stored ID
 * straight through leaves the combobox unable to match any item, so the saved
 * zone renders unselected. Selecting by canonical form fixes that.
 */
function toItemId(value: string): string {
  return idByCanonicalForm.get(toRuntimeCanonicalIanaId(value)) ?? value;
}

export function TimeZoneSelect({
  id,
  value,
  onValueChange,
  className,
  disabled,
  ...ariaProps
}: {
  id?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}) {
  const { t } = useTranslation();

  const anchorRef = useComboboxAnchor();

  const [isSearching, setIsSearching] = React.useState(false);

  const now = new Date();

  return (
    <Combobox
      items={isSearching ? allIds : curatedIds}
      value={value ? toItemId(value) : null}
      onValueChange={(id) => {
        if (id) {
          // Report the modern spelling regardless of how the runtime spells it,
          // so callers persist a stable, tzdb-canonical ID.
          onValueChange?.(normalizeLegacyIanaId(id));
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
      filter={matchesTimezoneQuery}
      autoHighlight={true}
    >
      <div ref={anchorRef} className={cn("min-w-64", className)}>
        <ComboboxInput
          id={id}
          disabled={disabled}
          placeholder={t("timezoneInputPlaceholder", {
            defaultValue: "Search time zone…",
          })}
          {...ariaProps}
        >
          <InputGroupAddon>
            <GlobeIcon />
          </InputGroupAddon>
        </ComboboxInput>
      </div>
      <ComboboxContent align="end" anchor={anchorRef.current}>
        <ComboboxEmpty>
          {t("timeZoneSelect__noOption", {
            defaultValue: "No option found",
          })}
        </ComboboxEmpty>
        <ComboboxList>
          {(entry, index) => (
            <ComboboxItem key={entry} value={entry} index={index}>
              <span className="min-w-0 flex-1 truncate">
                {getCityFromTimezoneId(entry)}
              </span>
              <span className="rounded-full px-1 py-0.5 text-center text-muted-foreground text-xs tabular-nums">
                <Time value={now} preset="time" timeZone={entry} />
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
