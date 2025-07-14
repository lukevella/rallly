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
  initialValue,
}: {
  children?: React.ReactNode;
  initialValue: Partial<Preferences>;
}) => {
  const { user } = useUser();
  const [preferences = {}, setPreferences] = useLocalStorage(
    "rallly.preferences",
    initialValue,
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

  const updatePreferences = trpc.user.updatePreferences.useMutation();

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updatePreferences: async (newPreferences) => {
          setPreferences((prev) => ({
            ...prev,
            ...newPreferences,
          }));

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
