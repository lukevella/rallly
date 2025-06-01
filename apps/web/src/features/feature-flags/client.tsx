"use client";

import React from "react";
import type { Feature, FeatureFlagConfig } from "./types";

const FeatureFlagsContext = React.createContext<FeatureFlagConfig | undefined>(
  undefined,
);

interface FeatureFlagsProviderProps {
  value: FeatureFlagConfig;
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

export function useFeatureFlag(featureName: Feature): boolean {
  const context = React.useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error(
      "useFeatureFlag must be used within a FeatureFlagsProvider",
    );
  }
  return context[featureName] ?? false;
}

export function IfFeatureEnabled({
  feature,
  children,
}: {
  feature: Feature;
  children: React.ReactNode;
}) {
  const featureEnabled = useFeatureFlag(feature);
  return featureEnabled ? children : null;
}
