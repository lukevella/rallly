"use client";
import { createContextualCan } from "@casl/react";
import React from "react";
import type {
  AppAbility,
  AppContext,
  UserContext,
} from "@/lib/ability-manager/ability";
import { defineAbilityFor } from "@/lib/ability-manager/ability";

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

export const useAppAbility = () => {
  const ability = React.useContext(AbilityContext);
  return ability;
};
