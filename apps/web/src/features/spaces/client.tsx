"use client";
import React from "react";
import type { SpaceDTO } from "@/features/spaces/queries";

export const SpaceContext = React.createContext<SpaceDTO | null>(null);

export const useSpace = () => {
  const space = React.useContext(SpaceContext);

  if (!space) {
    throw new Error("useSpace must be used within a SpaceProvider");
  }

  return space;
};

export const SpaceProvider = ({
  space,
  children,
}: {
  space: SpaceDTO;
  children?: React.ReactNode;
}) => {
  return (
    <SpaceContext.Provider value={space}>{children}</SpaceContext.Provider>
  );
};
