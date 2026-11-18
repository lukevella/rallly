"use client";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@rallly/ui/command";
import { CheckIcon } from "lucide-react";
import * as React from "react";
import {
  getAllTimezoneIds,
  getCityFromTimezoneId,
  getCuratedTimezoneIds,
  matchesTimezoneQuery,
} from "@/components/time-zone-picker/timezone-data";
import { Trans, useTranslation } from "@/i18n/client";
import { Time } from "@/lib/datetime/time";
import { toRuntimeCanonicalIanaId } from "@/lib/utils/timezone-schema";

const allIds = getAllTimezoneIds().sort((a, b) =>
  getCityFromTimezoneId(a).localeCompare(getCityFromTimezoneId(b)),
);

const curatedIds = getCuratedTimezoneIds(allIds);

/**
 * The searchable list of zones: the curated shortlist until the viewer types,
 * then every zone matching the query by any spelling of its city. Loaded when
 * the picker opens, so the zone data and the search stay out of the page.
 */
export function TimeZoneList({
  timeZone,
  onSelect,
}: {
  timeZone: string;
  onSelect: (timeZone: string) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");

  const selected = toRuntimeCanonicalIanaId(timeZone);
  // Until the viewer searches, their current zone leads the shortlist, so
  // it is visible even when it isn't one of the curated cities.
  const current =
    allIds.find((id) => toRuntimeCanonicalIanaId(id) === selected) ?? timeZone;
  const items = query.trim()
    ? allIds.filter((id) => matchesTimezoneQuery(id, query))
    : [current, ...curatedIds.filter((id) => id !== current)];
  const now = new Date();

  return (
    <Command shouldFilter={false} className="[[cmdk-input]]:**:h-12">
      <CommandInput
        autoFocus={true}
        value={query}
        onValueChange={setQuery}
        placeholder={t("timezoneInputPlaceholder", {
          defaultValue: "Search time zone…",
        })}
      />
      <CommandList className="p-1">
        <CommandEmpty>
          <Trans
            i18nKey="timeZoneSelect__noOption"
            defaults="No option found"
          />
        </CommandEmpty>
        {items.map((id) => (
          <CommandItem
            key={id}
            value={id}
            className="p-2"
            onSelect={() => onSelect(id)}
          >
            <span className="min-w-0 flex-1 truncate">
              {getCityFromTimezoneId(id)}
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">
              <Time value={now} preset="time" timeZone={id} />
            </span>
            <CheckIcon
              className={
                toRuntimeCanonicalIanaId(id) === selected
                  ? "size-4"
                  : "invisible size-4"
              }
            />
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
