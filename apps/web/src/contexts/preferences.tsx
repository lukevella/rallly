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
  updatePreferences: (preferences: Partial<Preferences>) => void;
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
  onUpdate?: (preferences: Partial<Preferences>) => void;
}) => {
  const [preferences, setPreferences] = useSetState<Preferences>(initialValue);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updatePreferences: (newPreferences) => {
          setPreferences(newPreferences);
          onUpdate?.(newPreferences);
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
