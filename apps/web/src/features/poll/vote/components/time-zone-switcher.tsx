"use client";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { useDeviceDateTime } from "@/lib/datetime/device";

/**
 * The viewer's time zone, inline in the header rather than behind a dialog,
 * so changing it is one interaction. `TimeZoneSelect` is already a combobox
 * with search, a curated shortlist and the current time per zone.
 */
export function TimeZoneSwitcher() {
  const { t } = useTranslation();
  const { timeZone } = useDateTimeConfig();
  const { setTimeZone } = useDeviceDateTime();

  if (!timeZone) {
    return null;
  }

  return (
    <TimeZoneSelect
      value={timeZone}
      onValueChange={setTimeZone}
      aria-label={t("timeZone")}
      // Narrower than the select's own default, which is sized for a form
      // field rather than a row of header controls.
      className="min-w-0 sm:w-48"
    />
  );
}
