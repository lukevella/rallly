"use client";

import React from "react";
import type { MemberAbility } from "./ability";
import { defineAbilityForMember } from "./ability";
import type { MemberDTO } from "./types";

const MemberContext = React.createContext<{
  data: MemberDTO;
  ability: MemberAbility;
} | null>(null);

export const MemberProvider = ({
  data,
  children,
}: {
  data: MemberDTO;
  children: React.ReactNode;
}) => {
  const value = React.useMemo(() => {
    const ability = defineAbilityForMember(data);
    return { data, ability };
  }, [data]);
  return (
    <MemberContext.Provider value={value}>{children}</MemberContext.Provider>
  );
};

export const useMemberAbility = () => {
  const value = React.useContext(MemberContext);
  if (!value) {
    throw new Error("useMemberAbility must be used within a MemberProvider");
  }
  return value;
};
