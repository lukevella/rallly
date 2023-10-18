import { trpc } from "@rallly/backend";
import Cookies from "js-cookie";
import { Session } from "next-auth";
import { signIn, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import React from "react";
import { z } from "zod";

import { PostHogProvider } from "@/contexts/posthog";
import { PreferencesProvider } from "@/contexts/preferences";
import { isSelfHosted } from "@/utils/constants";

import { useRequiredContext } from "./use-required-context";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().nullable(),
  isGuest: z.boolean(),
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

export const useAuthenticatedUser = () => {
  const { user, ...rest } = useRequiredContext(UserContext, "UserContext");
  if (user.isGuest) {
    throw new Error("Forget to prefetch user identity");
  }

  return { user, ...rest };
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

  const { t } = useTranslation();

  React.useEffect(() => {
    if (session.status === "unauthenticated") {
      // Begin: Legacy token migration
      const legacyToken = Cookies.get("legacy-token");
      // It's important to remove the token from the cookies,
      // otherwise when the user signs out.
      if (legacyToken) {
        Cookies.remove("legacy-token");
        signIn("legacy-token", {
          token: legacyToken,
        });
        return;
      }
      // End: Legacy token migration
      signIn("guest");
    }
  }, [session.status]);

  // TODO (Luke Vella) [2023-09-19]: Remove this when we have a better way to query for an active subscription
  trpc.user.subscription.useQuery(undefined, {
    enabled: !isSelfHosted,
  });

  if (!user || !session.data) {
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        user: {
          id: user.id as string,
          name: user.name ?? t("guest"),
          email: user.email || null,
          isGuest: user.email === null,
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
