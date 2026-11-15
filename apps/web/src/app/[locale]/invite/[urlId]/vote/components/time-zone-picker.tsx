"use client";

import { cn } from "@rallly/ui";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@rallly/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import * as React from "react";
import {
  getAllTimezoneIds,
  getCityFromTimezoneId,
  getCuratedTimezoneIds,
  matchesTimezoneQuery,
} from "@/components/time-zone-picker/timezone-data";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { useDeviceDateTime } from "@/lib/datetime/device";
import { Time } from "@/lib/datetime/time";
import {
  normalizeLegacyIanaId,
  toRuntimeCanonicalIanaId,
} from "@/lib/utils/timezone-schema";

const allIds = getAllTimezoneIds().sort((a, b) =>
  getCityFromTimezoneId(a).localeCompare(getCityFromTimezoneId(b)),
);

const curatedIds = getCuratedTimezoneIds(allIds);

/**
 * The viewer's time zone as its city; tapping it opens a
 * searchable list (the curated shortlist until the viewer types, then every
 * zone matching the query by any spelling of its city).
 */
export function TimeZonePicker({
  className,
  children,
  triggerLabel,
  onChange,
}: {
  className?: string;
  /** The trigger's text, in place of the city. */
  children?: React.ReactNode;
  /** The trigger's accessible name, when `children` changes what it shows. */
  triggerLabel?: string;
  onChange?: (timeZone: string) => void;
}) {
  const { t } = useTranslation();
  const { timeZone } = useDateTimeConfig();
  const { setTimeZone } = useDeviceDateTime();
  const dialog = useDialog();
  const [query, setQuery] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  if (!timeZone) {
    return null;
  }

  const selected = toRuntimeCanonicalIanaId(timeZone);
  // Until the viewer searches, their current zone leads the shortlist, so
  // it is visible even when it isn't one of the curated cities.
  const current =
    allIds.find((id) => toRuntimeCanonicalIanaId(id) === selected) ?? timeZone;
  const items = query.trim()
    ? allIds.filter((id) => matchesTimezoneQuery(id, query))
    : [current, ...curatedIds.filter((id) => id !== current)];
  const now = new Date();
  const city = getCityFromTimezoneId(timeZone);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "inline-flex items-center gap-1 text-left underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 hover:decoration-foreground",
          className,
        )}
        onClick={() => {
          setQuery("");
          dialog.trigger();
        }}
        aria-label={
          triggerLabel ??
          t("changeTimeZoneFrom", {
            defaultValue: "Time zone: {city}. Change time zone",
            city,
          })
        }
      >
        {children ?? city}
        <ChevronDownIcon
          aria-hidden="true"
          className="size-3.5 text-muted-foreground"
        />
      </button>
      <Dialog {...dialog.dialogProps}>
        <DialogContent
          finalFocus={triggerRef}
          size="md"
          className="*:data-[slot=dialog-scroller]:p-0"
        >
          <DialogTitle className="sr-only">
            <Trans i18nKey="timeZone" defaults="Time zone" />
          </DialogTitle>
          <DialogDescription className="sr-only">
            <Trans
              i18nKey="timeZoneSettingDescription"
              defaults="Dates and times are shown in this time zone."
            />
          </DialogDescription>
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
                  onSelect={() => {
                    setTimeZone(normalizeLegacyIanaId(id));
                    onChange?.(id);
                    dialog.dismiss();
                  }}
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
        </DialogContent>
      </Dialog>
    </>
  );
}
