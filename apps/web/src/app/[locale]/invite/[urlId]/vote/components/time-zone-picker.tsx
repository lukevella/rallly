"use client";

import { cn } from "@rallly/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { ChevronDownIcon } from "lucide-react";
import dynamic from "next/dynamic";
import * as React from "react";
import { Spinner } from "@/components/spinner";
import { getCityFromTimezoneId } from "@/components/time-zone-picker/timezone-data";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { useDeviceDateTime } from "@/lib/datetime/device";
import { normalizeLegacyIanaId } from "@/lib/utils/timezone-schema";

const loadTimeZoneList = () =>
  import("./time-zone-list").then((mod) => mod.TimeZoneList);

const TimeZoneList = dynamic(loadTimeZoneList, {
  ssr: false,
  loading: () => (
    <div className="flex h-40 items-center justify-center">
      <Spinner />
    </div>
  ),
});

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
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  if (!timeZone) {
    return null;
  }

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
        // Fetched ahead of the click, so the list is there when the dialog opens.
        onPointerEnter={loadTimeZoneList}
        onFocus={loadTimeZoneList}
        onClick={() => dialog.trigger()}
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
          <TimeZoneList
            timeZone={timeZone}
            onSelect={(id) => {
              setTimeZone(normalizeLegacyIanaId(id));
              onChange?.(id);
              dialog.dismiss();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
