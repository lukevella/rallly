import { trpc } from "@rallly/backend";
import Cookies from "js-cookie";
import { signIn, useSession } from "next-auth/react";
import React from "react";
import { z } from "zod";

import { PostHogProvider } from "@/contexts/posthog";
import { isSelfHosted } from "@/utils/constants";

import { useRequiredContext } from "./use-required-context";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().nullable(),
  isGuest: z.boolean(),
});

export const UserContext = React.createContext<{
  user: z.infer<typeof userSchema>;
  refresh: () => void;
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

/**
 * Gets and removes the legacy token from the cookies
 * @return The legacy token if it exists, otherwise null
 */
const getLegacyToken = () => {
  const token = Cookies.get("legacy-token");
  // It's important to remove the token from the cookies,
  // otherwise when the user signs out.
  Cookies.remove("legacy-token");

  return token ?? null;
};

export const UserProvider = (props: { children?: React.ReactNode }) => {
  const session = useSession();

  const user = session.data?.user;

  const { data: userPreferences } = trpc.userPreferences.get.useQuery();

  React.useEffect(() => {
    if (session.status === "unauthenticated") {
      const legacyToken = getLegacyToken();
      if (legacyToken) {
        signIn("legacy-token", {
          token: legacyToken,
        });
      } else {
        // Default to a guest user if not authenticated
        signIn("guest");
      }
    }
  }, [session.status]);

  // TODO (Luke Vella) [2023-09-19]: Remove this when we have a better way to query for an active subscription
  trpc.user.subscription.useQuery(undefined, {
    enabled: !isSelfHosted,
  });

  if (!user || userPreferences === undefined || !session.data) {
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        user: {
          id: user.id as string,
          name: user.name as string,
          email: user.email as string | null,
          isGuest: user.isGuest as boolean,
        },
        refresh: session.update,
        ownsObject: ({ userId }) => {
          return userId ? [user.id].includes(userId) : false;
        },
      }}
    >
      <PostHogProvider>{props.children}</PostHogProvider>
    </UserContext.Provider>
  );
};
