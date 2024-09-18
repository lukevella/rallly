"use client";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import React from "react";

import { useTranslation } from "@/app/i18n/client";
import { Spinner } from "@/components/spinner";
import { useSubscription } from "@/contexts/plan";
import { PostHogProvider } from "@/contexts/posthog";
import { PreferencesProvider } from "@/contexts/preferences";
import { trpc } from "@/utils/trpc/client";

import { useRequiredContext } from "./use-required-context";

type UserData = {
  id: string;
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
  ownsObject: (obj: { userId?: string | null }) => boolean;
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

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const isGuest = !user.email;
  const tier = isGuest ? "guest" : subscription?.active ? "pro" : "hobby";

  return (
    <UserContext.Provider
      value={{
        user: {
          id: user.id as string,
          name: user.name ?? t("guest"),
          email: user.email || null,
          isGuest,
          tier,
          timeZone: user.timeZone ?? null,
          image: user.image ?? null,
          locale: user.locale ?? i18n.language,
        },
        refresh: session.update,
        ownsObject: ({ userId }) => {
          return userId ? [user.id].includes(userId) : false;
        },
      }}
    >
      <PreferencesProvider
        initialValue={{
          locale: user.locale ?? undefined,
          timeZone: user.timeZone ?? undefined,
          timeFormat: user.timeFormat ?? undefined,
          weekStart: user.weekStart ?? undefined,
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
        <PostHogProvider>{props.children}</PostHogProvider>
      </PreferencesProvider>
    </UserContext.Provider>
  );
};
