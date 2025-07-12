"use client";

import React from "react";
import type { InstanceSettings } from "./schema";

const InstanceSettingsContext = React.createContext<InstanceSettings>({
  disableUserRegistration: false,
});

export function InstanceSettingsProvider({
  value,
  children,
}: {
  value: InstanceSettings;
  children: React.ReactNode;
}) {
  return (
    <InstanceSettingsContext.Provider value={value}>
      {children}
    </InstanceSettingsContext.Provider>
  );
}

export const useInstanceSettings = () =>
  React.useContext(InstanceSettingsContext);
