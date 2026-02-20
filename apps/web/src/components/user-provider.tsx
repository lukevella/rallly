"use client";
import { usePostHog } from "@rallly/posthog/client";
import { useRouter } from "next/navigation";
import React from "react";
import type { UserAbility } from "@/features/user/ability";
import { defineAbilityFor } from "@/features/user/ability";
import type { UserDTO } from "@/features/user/schema";
import { authClient } from "@/lib/auth-client";
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

export const UserProvider = ({
  children,
  user,
}: {
  children?: React.ReactNode;
  user?: UserDTO;
}) => {
  const posthog = usePostHog();

  const userId = user?.id;
  const isGuest = user?.isGuest;

  React.useEffect(() => {
    if (userId && !isGuest) {
      posthog.identify(userId);
    }
  }, [userId, isGuest, posthog]);

  const router = useRouter();
  const value = React.useMemo<UserContextValue>(() => {
    return {
      user,
      createGuestIfNeeded: async () => {
        const isLegacyGuest = user?.id.startsWith("user-");
        if (!user || isLegacyGuest) {
          await authClient.signIn.anonymous();
          router.refresh();
        }
      },
      getAbility: () => defineAbilityFor(user),
      ownsObject: (resource) => {
        return user ? isOwner(resource, { id: user.id }) : false;
      },
    };
  }, [user, router]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
