"use client";
import { createContextualCan } from "@casl/react";
import React from "react";
import { defineAbilityFor } from "@/lib/ability-manager/ability";
import type { AppAbility, AppContext, UserContext } from "./types";

export const AbilityContext = React.createContext<AppAbility>({} as AppAbility);
export const Can = createContextualCan(AbilityContext.Consumer);

export const AbilityProvider = ({
  user,
  context,
  children,
}: {
  user?: UserContext;
  context?: AppContext;
  children: React.ReactNode;
}) => {
  const ability = defineAbilityFor(user, context);
  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
};

export const useAbility = () => {
  const ability = React.useContext(AbilityContext);
  return { ability };
};
