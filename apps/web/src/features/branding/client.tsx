"use client";

import React from "react";
import type { LogoSize } from "./types";

export interface BrandingConfig {
  primaryColor: {
    light: string;
    lightForeground: string;
    dark: string;
    darkForeground: string;
  };
  logo: {
    light: string;
    dark: string;
  };
  logoIcon: string;
  logoSize: LogoSize;
  hideAttribution: boolean;
  appName: string;
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
