import { TimeFormat } from "@rallly/database";
import React from "react";
import { useSetState } from "react-use";

import { useRequiredContext } from "@/components/use-required-context";

type Preferences = {
  timeZone?: string | null;
  locale?: string | null;
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
  onUpdate,
}: {
  children?: React.ReactNode;
  initialValue: Partial<Preferences>;
  onUpdate?: (preferences: Partial<Preferences>) => Promise<void>;
}) => {
  const [preferences, setPreferences] = useSetState<Preferences>(initialValue);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updatePreferences: async (newPreferences) => {
          setPreferences(newPreferences);
          await onUpdate?.(newPreferences);
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
