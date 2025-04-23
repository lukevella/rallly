"use client";

import type { TimeFormat } from "@rallly/database";
import React from "react";
import { useSetState } from "react-use";

import { useRequiredContext } from "@/components/use-required-context";
import { useUser } from "@/components/user-provider";
import { trpc } from "@/trpc/client";

type Preferences = {
  timeZone?: string | null;
  timeFormat?: TimeFormat | null;
  weekStart?: number | null;
};

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
  const [preferences, setPreferences] = useSetState<Preferences>(initialValue);
  const updatePreferences = trpc.user.updatePreferences.useMutation();

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updatePreferences: async (newPreferences) => {
          setPreferences(newPreferences);
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
