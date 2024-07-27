"use client";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import React from "react";
import { z } from "zod";

import { useTranslation } from "@/app/i18n/client";
import { Spinner } from "@/components/spinner";
import { useSubscription } from "@/contexts/plan";
import { PostHogProvider } from "@/contexts/posthog";
import { PreferencesProvider } from "@/contexts/preferences";

import { useRequiredContext } from "./use-required-context";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().nullable(),
  isGuest: z.boolean(),
  tier: z.enum(["guest", "hobby", "pro"]),
  timeZone: z.string().nullish(),
  timeFormat: z.enum(["hours12", "hours24"]).nullish(),
  weekStart: z.number().min(0).max(6).nullish(),
});

export const UserContext = React.createContext<{
  user: z.infer<typeof userSchema>;
  refresh: (data?: Record<string, unknown>) => Promise<Session | null>;
  ownsObject: (obj: { userId: string | null }) => boolean;
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

  const { t } = useTranslation();

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
          isGuest: !user.email,
          tier,
          timeFormat: user.timeFormat ?? null,
          timeZone: user.timeZone ?? null,
          weekStart: user.weekStart ?? null,
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
          await session.update(newPreferences);
        }}
      >
        <PostHogProvider>{props.children}</PostHogProvider>
      </PreferencesProvider>
    </UserContext.Provider>
  );
};
