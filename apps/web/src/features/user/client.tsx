"use client";
import { posthog } from "@rallly/posthog/client";
import { useRouter } from "next/navigation";
import React from "react";
import type { UserAbility } from "@/features/user/ability";
import { defineAbilityFor } from "@/features/user/ability";
import type { UserDTO } from "@/features/user/schema";
import { authClient } from "@/lib/auth-client";
import { isOwner } from "@/lib/utils/permissions";

const UserContext = React.createContext<UserDTO | null | undefined>(undefined);

export function UserProvider({
  user,
  children,
}: {
  user: UserDTO | null;
  children: React.ReactNode;
}) {
  const userId = user?.id;
  const isGuest = user?.isGuest;

  React.useEffect(() => {
    if (userId && !isGuest) {
      posthog.identify(userId);
    }
  }, [userId, isGuest]);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/**
 * For components rendered on routes gated by a logged-in (non-guest) user
 * (e.g. behind requireUser). Throws instead of returning null so consumers
 * don't need to handle the unauthenticated case.
 */
export function useAuthedUser() {
  const user = React.useContext(UserContext);

  if (user === undefined) {
    throw new Error("useAuthedUser must be used within a UserProvider");
  }

  if (!user || user.isGuest) {
    throw new Error(
      "useAuthedUser was rendered on a route without a logged in user. Components that call it belong on login-gated routes.",
    );
  }

  return user;
}

export function useUser() {
  const user = React.useContext(UserContext);
  const router = useRouter();

  if (user === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return React.useMemo(() => {
    return {
      user: user ?? undefined,
      createGuestIfNeeded: async () => {
        if (!user) {
          await authClient.signIn.anonymous();
          router.refresh();
        }
      },
      getAbility: (): UserAbility => defineAbilityFor(user ?? undefined),
      ownsObject: (resource: { userId?: string | null }) => {
        return user ? isOwner(resource, { id: user.id }) : false;
      },
    };
  }, [user, router]);
}
