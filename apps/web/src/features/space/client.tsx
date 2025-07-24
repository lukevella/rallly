"use client";

import React from "react";
import type { MemberAbility } from "@/features/space/member/ability";
import { defineAbilityForMember } from "@/features/space/member/ability";
import type { SpaceDTO } from "@/features/space/types";
import type { SpaceAbility } from "./ability";
import { defineAbilityForSpace } from "./ability";

const SpaceContext = React.createContext<{
  data: SpaceDTO;
  getAbility: () => SpaceAbility;
  getMemberAbility: () => MemberAbility;
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
  userId,
  children,
}: {
  data: SpaceDTO;
  userId: string;
  children: React.ReactNode;
}) => {
  const value = React.useMemo(
    () => ({
      data,
      getAbility: () => defineAbilityForSpace(data),
      getMemberAbility: () =>
        defineAbilityForMember({
          userId,
          spaceId: data.id,
          role: data.role,
        }),
    }),
    [data, userId],
  );

  return (
    <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>
  );
};
