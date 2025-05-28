"use client";

import React from "react";

interface Features {
  storage: boolean;
}

const FeatureFlagsContext = React.createContext<Features | undefined>(
  undefined,
);

interface FeatureFlagsProviderProps {
  value: Features;
  children: React.ReactNode;
}

export function FeatureFlagsProvider({
  value,
  children,
}: FeatureFlagsProviderProps) {
  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlag(featureName: keyof Features): boolean {
  const context = React.useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error(
      "useFeatureFlag must be used within a FeatureFlagsProvider",
    );
  }
  return context[featureName] ?? false;
}
