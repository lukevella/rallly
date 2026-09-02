"use client";

import React from "react";
import type { InstancePolicy } from "./types";

const InstancePolicyContext = React.createContext<InstancePolicy | undefined>(
  undefined,
);

export function InstancePolicyProvider({
  value,
  children,
}: {
  value: InstancePolicy;
  children: React.ReactNode;
}) {
  return (
    <InstancePolicyContext.Provider value={value}>
      {children}
    </InstancePolicyContext.Provider>
  );
}

export function useInstancePolicy(): InstancePolicy {
  const context = React.useContext(InstancePolicyContext);
  if (context === undefined) {
    throw new Error(
      "useInstancePolicy must be used within an InstancePolicyProvider",
    );
  }
  return context;
}
