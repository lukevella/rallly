"use client";
import React from "react";
import type { UserAbility } from "@/features/user/ability";
import { defineAbilityFor } from "@/features/user/ability";
import type { UserDTO } from "@/features/user/schema";
import { isOwner } from "@/utils/permissions";
import { useRequiredContext } from "./use-required-context";

type GuestUser = {
  id: string;
  isGuest: true;
};

type UserContextValue = {
  user?: UserDTO | GuestUser;
  getAbility: () => UserAbility;
  ownsObject: (obj: {
    userId?: string | null;
    guestId?: string | null;
  }) => boolean;
};

export const UserContext = React.createContext<UserContextValue | null>(null);

export const useUser = () => {
  return useRequiredContext(UserContext, "UserContext");
};

export const useAuthenticatedUser = () => {
  const { user } = useUser();
  if (!user || user.isGuest) {
    throw new Error("User is not defined");
  }

  return { user };
};

export const UserProvider = ({
  children,
  user,
}: {
  children?: React.ReactNode;
  user?: UserDTO;
}) => {
  const isGuest = !user;
  const value = React.useMemo<UserContextValue>(() => {
    return {
      user,
      getAbility: () => defineAbilityFor(user),
      ownsObject: (resource) => {
        return user ? isOwner(resource, { id: user.id, isGuest }) : false;
      },
    };
  }, [user, isGuest]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
