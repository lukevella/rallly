"use client";

import { buttonVariants } from "@rallly/ui";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@rallly/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { toast } from "@rallly/ui/sonner";
import {
  ArrowUpRight,
  CalendarIcon,
  ClockIcon,
  GlobeIcon,
  LanguagesIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { LanguageSelect } from "@/components/language-selector";
import { SettingIcon } from "@/components/setting-icon";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { updateLocalizationAction } from "@/features/user/actions";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";
import { getLocaleDefaults } from "@/lib/datetime/locales";
import type { TimeFormat } from "@/lib/datetime/types";
import { setLocaleCookie, useLocale } from "@/lib/locale/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";

export const LocalizationPreferences = ({
  initialValues,
}: {
  initialValues: {
    locale?: string;
    timeFormat?: TimeFormat;
    timeZone?: string;
    weekStart?: number;
  };
}) => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const localeDefaults = getLocaleDefaults(locale);
  const { weekdays } = useDateTime();
  const updateLocalization = useSafeAction(updateLocalizationAction);

  const [language, setLanguage] = React.useState(
    initialValues.locale ?? locale,
  );
  const [timeZone, setTimeZone] = React.useState(
    initialValues.timeZone ?? getBrowserTimeZone(),
  );
  const [timeFormat, setTimeFormat] = React.useState(
    initialValues.timeFormat ?? localeDefaults.timeFormat,
  );
  const [weekStart, setWeekStart] = React.useState(
    initialValues.weekStart ?? localeDefaults.weekStart,
  );

  const save = async (input: {
    locale?: string;
    timeZone?: string;
    timeFormat?: TimeFormat;
    weekStart?: number;
  }) => {
    const result = await updateLocalization.executeAsync(input);
    const saved = !result?.serverError && !result?.validationErrors;
    if (saved) {
      toast.success(t("saved", { defaultValue: "Saved" }));
    }
    return saved;
  };

  const weekStartOptions = weekdays().map(({ day, label }) => ({
    value: day.toString(),
    label,
  }));

  const timeFormatOptions = [
    { value: "hours12", label: t("12h") },
    { value: "hours24", label: t("24h") },
  ];

  return (
    <div>
      <FieldGroup variant="divided">
        <Field orientation="responsive">
          <SettingIcon>
            <LanguagesIcon />
          </SettingIcon>
          <FieldContent>
            <FieldLabel htmlFor="language-select">
              <Trans i18nKey="language" defaults="Language" />
            </FieldLabel>
            <FieldDescription>
              <Trans
                i18nKey="languageSettingDescription"
                defaults="The language the app is displayed in."
              />
            </FieldDescription>
          </FieldContent>
          <LanguageSelect
            id="language-select"
            className="min-w-32"
            value={language}
            onChange={async (nextLanguage) => {
              if (nextLanguage === language) {
                return;
              }
              const previousLanguage = language;
              setLanguage(nextLanguage);
              // Set the cookie before executing: useSafeAction refreshes the
              // router on success, and that refresh must read the new locale.
              // Writing the cookie server-side would collide with
              // updateUser's session cookie and drop it. Roll it back to the
              // locale this page is rendered in if the save doesn't land.
              setLocaleCookie(nextLanguage);
              let saved = false;
              try {
                saved = await save({ locale: nextLanguage });
              } finally {
                if (!saved) {
                  setLocaleCookie(locale);
                  setLanguage(previousLanguage);
                }
              }
            }}
          />
        </Field>
        <Field orientation="responsive">
          <SettingIcon>
            <GlobeIcon />
          </SettingIcon>
          <FieldContent>
            <FieldLabel htmlFor="time-zone-select">
              <Trans i18nKey="timeZone" defaults="Time zone" />
            </FieldLabel>
            <FieldDescription>
              <Trans
                i18nKey="timeZoneSettingDescription"
                defaults="Dates and times are shown in this time zone."
              />
            </FieldDescription>
          </FieldContent>
          <TimeZoneSelect
            id="time-zone-select"
            className="min-w-56"
            value={timeZone}
            onValueChange={async (nextTimeZone) => {
              if (nextTimeZone === timeZone) {
                return;
              }
              const previousTimeZone = timeZone;
              setTimeZone(nextTimeZone);
              if (!(await save({ timeZone: nextTimeZone }))) {
                setTimeZone(previousTimeZone);
              }
            }}
          />
        </Field>
        <Field orientation="responsive">
          <SettingIcon>
            <ClockIcon />
          </SettingIcon>
          <FieldContent>
            <FieldLabel htmlFor="time-format-select">
              <Trans i18nKey="timeFormat" defaults="Time format" />
            </FieldLabel>
            <FieldDescription>
              <Trans
                i18nKey="timeFormatSettingDescription"
                defaults="Show times in 12-hour or 24-hour format."
              />
            </FieldDescription>
          </FieldContent>
          <Select
            items={timeFormatOptions}
            value={timeFormat}
            onValueChange={async (value) => {
              if (!value || value === timeFormat) {
                return;
              }
              const previousTimeFormat = timeFormat;
              const nextTimeFormat = value as TimeFormat;
              setTimeFormat(nextTimeFormat);
              if (!(await save({ timeFormat: nextTimeFormat }))) {
                setTimeFormat(previousTimeFormat);
              }
            }}
          >
            <SelectTrigger id="time-format-select" className="min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeFormatOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field orientation="responsive">
          <SettingIcon>
            <CalendarIcon />
          </SettingIcon>
          <FieldContent>
            <FieldLabel htmlFor="week-start-select">
              <Trans i18nKey="startOfWeek" defaults="Start of week" />
            </FieldLabel>
            <FieldDescription>
              <Trans
                i18nKey="startOfWeekSettingDescription"
                defaults="The day calendars start the week on."
              />
            </FieldDescription>
          </FieldContent>
          <Select
            items={weekStartOptions}
            value={weekStart.toString()}
            onValueChange={async (value) => {
              if (!value) {
                return;
              }
              const previousWeekStart = weekStart;
              const nextWeekStart = Number.parseInt(value, 10);
              if (nextWeekStart === previousWeekStart) {
                return;
              }
              setWeekStart(nextWeekStart);
              if (!(await save({ weekStart: nextWeekStart }))) {
                setWeekStart(previousWeekStart);
              }
            }}
          >
            <SelectTrigger id="week-start-select" className="min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weekStartOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <div className="mt-4 border-t pt-4">
        <Link
          target="_blank"
          href="https://support.rallly.co/contribute/translations"
          className={buttonVariants({ variant: "ghost" })}
        >
          <Trans i18nKey="becomeATranslator" defaults="Help translate" />
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </div>
  );
};
