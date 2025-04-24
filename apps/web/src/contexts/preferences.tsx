"use client";

import type { TimeFormat } from "@rallly/database";
import React from "react";
import { useLocalStorage } from "react-use";
import { z } from "zod";

import { useRequiredContext } from "@/components/use-required-context";
import { useUser } from "@/components/user-provider";
import { trpc } from "@/trpc/client";

type Preferences = {
  timeZone?: string;
  timeFormat?: TimeFormat;
  weekStart?: number;
};

const timeFormatSchema = z.enum(["hours12", "hours24"]);

type PreferencesContextValue = {
  preferences: Preferences;
  updatePreferences: (preferences: Partial<Preferences>) => Promise<void>;
};

const PreferencesContext = React.createContext<PreferencesContextValue | null>(
  null,
);

export const PreferencesProvider = ({
  children,
  initialValue,
}: {
  children?: React.ReactNode;
  initialValue: Partial<Preferences>;
}) => {
  const { user } = useUser();
  const [preferredTimezone, setPreferredTimezone] = useLocalStorage(
    "rallly.preferredTimezone",
    initialValue.timeZone,
  );
  const [preferredTimeFormat, setPreferredTimeFormat] = useLocalStorage(
    "rallly.preferredTimeFormat",
    initialValue.timeFormat,
    {
      raw: false,
      serializer: timeFormatSchema.parse,
      deserializer: timeFormatSchema.optional().catch(undefined).parse,
    },
  );
  const [preferredWeekStart, setPreferredWeekStart] = useLocalStorage(
    "rallly.preferredWeekStart",
    initialValue.weekStart,
  );
  const updatePreferences = trpc.user.updatePreferences.useMutation();

  return (
    <PreferencesContext.Provider
      value={{
        preferences: {
          timeZone: preferredTimezone,
          timeFormat: preferredTimeFormat,
          weekStart: preferredWeekStart,
        },
        updatePreferences: async (newPreferences) => {
          if (newPreferences.timeZone) {
            setPreferredTimezone(newPreferences.timeZone);
          }

          if (newPreferences.timeFormat) {
            setPreferredTimeFormat(newPreferences.timeFormat);
          }

          if (newPreferences.weekStart) {
            setPreferredWeekStart(newPreferences.weekStart);
          }

          if (!user.isGuest) {
            await updatePreferences.mutateAsync({
              timeZone: newPreferences.timeZone ?? undefined,
              timeFormat: newPreferences.timeFormat ?? undefined,
              weekStart: newPreferences.weekStart ?? undefined,
            });
          }
        },
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  return useRequiredContext(PreferencesContext);
};
