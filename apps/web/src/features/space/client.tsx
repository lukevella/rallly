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
}>({
  data: {
    id: "",
    name: "",
    ownerId: "system",
    role: "member",
    tier: "hobby",
  },
  getAbility: () => defineAbilityForSpace(),
  getMemberAbility: () => defineAbilityForMember(),
});

export const useSpace = () => {
  return React.useContext(SpaceContext);
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
          user: {
            id: userId,
          },
          space: {
            id: data.id,
            ownerId: data.ownerId,
            role: data.role,
          },
        }),
    }),
    [data, userId],
  );

  return (
    <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>
  );
};
