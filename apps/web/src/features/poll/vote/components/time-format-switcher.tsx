"use client";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@rallly/ui/segmented-control";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { useDeviceDateTime } from "@/lib/datetime/device";
import { getLocaleDefaults } from "@/lib/datetime/locales";

/**
 * The viewer's clock format, beside the time zone rather than inside its
 * dialog. Only time polls render it: a date has no time to format.
 */
export function TimeFormatSwitcher() {
  const { t } = useTranslation();
  const { locale, timeFormat } = useDateTimeConfig();
  const { setTimeFormat } = useDeviceDateTime();

  // With no explicit preference the locale's own default is what renders.
  const value = timeFormat ?? getLocaleDefaults(locale).timeFormat;

  return (
    <SegmentedControl
      aria-label={t("timeFormat", { defaultValue: "Time format" })}
      value={value}
      onValueChange={(next) => {
        if (next) {
          setTimeFormat(next as "hours12" | "hours24");
        }
      }}
    >
      {/* The visible label is compact to fit the header; the accessible
          name stays the long form, which is what a screen reader should
          read out. The shared `12h`/`24h` keys hold that long form and
          are already translated, so they are reused here rather than
          redefined. */}
      <SegmentedControlItem
        value="hours12"
        aria-label={t("12h")}
        className="px-2.5 text-xs"
      >
        <Trans i18nKey="12hShort" defaults="12h" />
      </SegmentedControlItem>
      <SegmentedControlItem
        value="hours24"
        aria-label={t("24h")}
        className="px-2.5 text-xs"
      >
        <Trans i18nKey="24hShort" defaults="24h" />
      </SegmentedControlItem>
    </SegmentedControl>
  );
}
