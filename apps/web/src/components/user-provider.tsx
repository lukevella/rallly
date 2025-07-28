"use client";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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
  createGuestIfNeeded: () => Promise<void>;
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
  const router = useRouter();
  const value = React.useMemo<UserContextValue>(() => {
    return {
      user,
      createGuestIfNeeded: async () => {
        if (!user) {
          await signIn("guest", {
            redirect: false,
          });
          router.refresh();
        }
      },
      getAbility: () => defineAbilityFor(user),
      ownsObject: (resource) => {
        return user
          ? isOwner(resource, { id: user.id, isGuest: user.isGuest })
          : false;
      },
    };
  }, [user, router]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
