"use client";

import React from "react";

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
  hideAttribution: boolean;
  appName: string;
}

export interface BrandingContextValue extends BrandingConfig {
  // False when the instance holds the white label addon: space branding is
  // suppressed and branding is managed from the control panel
  spaceBrandingAllowed: boolean;
}

const BrandingContext = React.createContext<BrandingContextValue | undefined>(
  undefined,
);

interface BrandingProviderProps {
  value: BrandingContextValue;
  children: React.ReactNode;
}

export function BrandingProvider({ value, children }: BrandingProviderProps) {
  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextValue {
  const context = React.useContext(BrandingContext);
  if (context === undefined) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
