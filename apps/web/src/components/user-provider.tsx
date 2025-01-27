"use client";
import { usePostHog } from "@rallly/posthog/client";
import type { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import React from "react";

import { useSubscription } from "@/contexts/plan";
import { PreferencesProvider } from "@/contexts/preferences";
import { useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { isOwner } from "@/utils/permissions";

import { useRequiredContext } from "./use-required-context";

type UserData = {
  id?: string;
  name: string;
  email?: string | null;
  isGuest: boolean;
  tier: "guest" | "hobby" | "pro";
  timeZone?: string | null;
  timeFormat?: "hours12" | "hours24" | null;
  weekStart?: number | null;
  image?: string | null;
  locale?: string | null;
};

export const UserContext = React.createContext<{
  user: UserData;
  refresh: (data?: Record<string, unknown>) => Promise<Session | null>;
  ownsObject: (obj: {
    userId?: string | null;
    guestId?: string | null;
  }) => boolean;
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

export const UserProvider = (props: { children?: React.ReactNode }) => {
  const session = useSession();
  const user = session.data?.user;
  const subscription = useSubscription();
  const updatePreferences = trpc.user.updatePreferences.useMutation();
  const { t, i18n } = useTranslation();

  const posthog = usePostHog();

  const isGuest = !user?.email;
  const tier = isGuest ? "guest" : subscription?.active ? "pro" : "hobby";

  React.useEffect(() => {
    if (user) {
      posthog?.identify(user.id, {
        email: user.email,
        name: user.name,
        tier,
        timeZone: user.timeZone ?? null,
        image: user.image ?? null,
        locale: user.locale ?? i18n.language,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <UserContext.Provider
      value={{
        user: {
          id: user?.id,
          name: user?.name ?? t("guest"),
          email: user?.email || null,
          isGuest,
          tier,
          timeZone: user?.timeZone ?? null,
          image: user?.image ?? null,
          locale: user?.locale ?? i18n.language,
        },
        refresh: session.update,
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
      <PreferencesProvider
        initialValue={{
          locale: user?.locale ?? undefined,
          timeZone: user?.timeZone ?? undefined,
          timeFormat: user?.timeFormat ?? undefined,
          weekStart: user?.weekStart ?? undefined,
        }}
        onUpdate={async (newPreferences) => {
          if (!isGuest) {
            await updatePreferences.mutateAsync({
              locale: newPreferences.locale ?? undefined,
              timeZone: newPreferences.timeZone ?? undefined,
              timeFormat: newPreferences.timeFormat ?? undefined,
              weekStart: newPreferences.weekStart ?? undefined,
            });
          }
          await session.update(newPreferences);
        }}
      >
        {props.children}
      </PreferencesProvider>
    </UserContext.Provider>
  );
};
