"use client";

import type { TimeFormat } from "@rallly/database";
import React from "react";
import { useLocalStorage } from "react-use";
import * as z from "zod";
import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { useRequiredContext } from "@/components/use-required-context";
import { LocaleSync, useLocale } from "@/lib/locale/client";
import { trpc } from "@/trpc/client";
import { DayjsProvider } from "@/utils/dayjs";

type Preferences = {
  timeZone?: string;
  timeFormat?: TimeFormat;
  weekStart?: number;
};

const timeFormatSchema = z.enum(["hours12", "hours24"]);

const preferencesSchema = z.object({
  timeZone: z.string().optional(),
  timeFormat: timeFormatSchema.optional(),
  weekStart: z.number().optional(),
});

type PreferencesContextValue = {
  preferences: Preferences;
  updatePreferences: (preferences: Partial<Preferences>) => Promise<void>;
};

const PreferencesContext = React.createContext<PreferencesContextValue | null>(
  null,
);

export const PreferencesProvider = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const { data: user } = trpc.user.getMe.useQuery();
  const { locale } = useLocale();
  const [preferences = {}, setPreferences] = useLocalStorage(
    "rallly.preferences",
    {
      timeZone: user?.timeZone,
      timeFormat: user?.timeFormat,
      weekStart: user?.weekStart,
    },
    {
      raw: false,
      serializer: JSON.stringify,
      deserializer: (value) => {
        try {
          return preferencesSchema.parse(JSON.parse(value));
        } catch {
          return {};
        }
      },
    },
  );

  const updatePreferencesMutation = trpc.user.updatePreferences.useMutation();

  const updatePreferences = async (newPreferences: Partial<Preferences>) => {
    setPreferences({
      ...preferences,
      ...newPreferences,
    });

    if (user && !user.isGuest) {
      await updatePreferencesMutation.mutateAsync({
        timeZone: newPreferences.timeZone ?? undefined,
        timeFormat: newPreferences.timeFormat ?? undefined,
        weekStart: newPreferences.weekStart ?? undefined,
      });
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
      }}
    >
      <DayjsProvider
        config={{
          locale,
          timeZone: preferences.timeZone ?? undefined,
          localeOverrides: {
            weekStart: preferences.weekStart ?? undefined,
            timeFormat: preferences.timeFormat ?? undefined,
          },
        }}
      >
        {children}
        <TimeZoneChangeDetector
          initialTimeZone={preferences.timeZone}
          onTimeZoneChange={(timeZone) => {
            updatePreferences({ timeZone });
          }}
        />
        <LocaleSync userLocale={user?.locale} />
      </DayjsProvider>
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  return useRequiredContext(PreferencesContext);
};
