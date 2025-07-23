"use client";

import React from "react";
import type { SpaceDTO } from "@/features/spaces/data";
import type { SpaceAbility } from "./ability";
import { defineAbilityForSpace } from "./ability";

const SpaceContext = React.createContext<{
  data: SpaceDTO;
  ability: SpaceAbility;
} | null>(null);

export const useSpace = () => {
  const context = React.useContext(SpaceContext);

  if (!context) {
    throw new Error("useSpace must be used within a SpaceProvider");
  }

  return context;
};

export const SpaceProvider = ({
  data,
  children,
}: {
  data: SpaceDTO;
  children: React.ReactNode;
}) => {
  const value = React.useMemo(
    () => ({ data, ability: defineAbilityForSpace(data) }),
    [data],
  );

  return (
    <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>
  );
};
