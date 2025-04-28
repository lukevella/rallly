"use client";
import { usePostHog } from "@rallly/posthog/client";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";

import { useTranslation } from "@/i18n/client";
import { isOwner } from "@/utils/permissions";

import { useRequiredContext } from "./use-required-context";

type UserData = {
  id?: string;
  name: string;
  email?: string;
  isGuest: boolean;
  tier: "guest" | "hobby" | "pro";
  image?: string;
};

export const UserContext = React.createContext<{
  user: UserData;
  refresh: () => void;
  ownsObject: (obj: {
    userId?: string | null;
    guestId?: string | null;
  }) => boolean;
  createGuestIfNeeded: () => Promise<void>;
  logout: () => Promise<void>;
} | null>(null);

export const useUser = () => {
  return useRequiredContext(UserContext, "UserContext");
};

export const IfAuthenticated = (props: { children?: React.ReactNode }) => {
  const { user } = useUser();
  if (user.isGuest) {
    return null;
  }

  return <>{props.children}</>;
};

export const IfGuest = (props: { children?: React.ReactNode }) => {
  const { user } = useUser();
  if (!user.isGuest) {
    return null;
  }

  return <>{props.children}</>;
};

type BaseUser = {
  id: string;
  tier: "guest" | "hobby" | "pro";
  image?: string;
  name?: string;
  email?: string;
};

type RegisteredUser = BaseUser & {
  email: string;
  name: string;
  tier: "hobby" | "pro";
};

type GuestUser = BaseUser & {
  tier: "guest";
};

export const UserProvider = ({
  children,
  user,
}: {
  children?: React.ReactNode;
  user?: RegisteredUser | GuestUser;
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const posthog = usePostHog();

  const isGuest = !user || user.tier === "guest";
  const tier = isGuest ? "guest" : user.tier;

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (user) {
      posthog?.identify(user.id, {
        email: user.email,
        name: user.name,
        tier,
        image: user.image,
      });
    }
  }, [user?.id]);

  return (
    <UserContext.Provider
      value={{
        user: {
          id: user?.id,
          name: user?.name ?? t("guest"),
          email: user?.email,
          isGuest,
          tier,
          image: user?.image,
        },
        createGuestIfNeeded: async () => {
          if (!user) {
            await signIn("guest", {
              redirect: false,
            });
            router.refresh();
          }
        },
        refresh: router.refresh,
        logout: async () => {
          await signOut();
          posthog?.capture("logout");
          posthog?.reset();
        },
        ownsObject: (resource) => {
          return user ? isOwner(resource, { id: user.id, isGuest }) : false;
        },
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
