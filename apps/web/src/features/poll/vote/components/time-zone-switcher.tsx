"use client";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import { GlobeIcon } from "lucide-react";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { getCityFromTimezoneId } from "@/components/time-zone-picker/timezone-data";
import { Trans } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { useDeviceDateTime } from "@/lib/datetime/device";

/**
 * The viewer's time zone on its own, because this header shows the time
 * format as its own control beside it. The shared `TimesShownIn` bundles
 * both into one dialog and still serves the legacy poll pages.
 */
export function TimeZoneSwitcher() {
  const { timeZone } = useDateTimeConfig();
  const { setTimeZone } = useDeviceDateTime();

  if (!timeZone) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="ghost">
            <GlobeIcon data-icon="inline-start" />
            <Trans
              i18nKey="cityTime"
              defaults="{city} time"
              values={{ city: getCityFromTimezoneId(timeZone) }}
            />
          </Button>
        }
      />
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="timeZone" defaults="Time zone" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="timeZoneSelectDescription"
              defaults="Times are shown in this time zone"
            />
          </DialogDescription>
        </DialogHeader>
        <TimeZoneSelect value={timeZone} onValueChange={setTimeZone} />
      </DialogContent>
    </Dialog>
  );
}
