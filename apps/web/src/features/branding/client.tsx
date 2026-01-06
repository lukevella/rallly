"use client";

import React from "react";

export interface BrandingConfig {
  primaryColor: {
    light: string;
    dark: string;
  };
  logo: {
    light: string;
    dark: string;
  };
  logoIcon: string;
  hideAttribution: boolean;
}

const BrandingContext = React.createContext<BrandingConfig | undefined>(
  undefined,
);

interface BrandingProviderProps {
  value: BrandingConfig;
  children: React.ReactNode;
}

export function BrandingProvider({ value, children }: BrandingProviderProps) {
  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingConfig {
  const context = React.useContext(BrandingContext);
  if (context === undefined) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
