import { trpc } from "@rallly/backend";
import Cookies from "js-cookie";
import { signIn, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import React from "react";

import { PostHogProvider } from "@/contexts/posthog";
import { isSelfHosted } from "@/utils/constants";

import { useRequiredContext } from "./use-required-context";

export const UserContext = React.createContext<{
  user: {
    isGuest: boolean;
    name: string;
    id: string;
    email: string | null;
  };
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

export const UserProvider = (props: { children?: React.ReactNode }) => {
  const { t } = useTranslation();

  const session = useSession();

  const user = session.data?.user;

  const { data: userPreferences } = trpc.userPreferences.get.useQuery();

  React.useEffect(() => {
    if (session.status === "unauthenticated") {
      const legacyToken = Cookies.get("legacy-token");
      Cookies.remove("legacy-token");
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

  const name = user.name || t("guest");
  return (
    <UserContext.Provider
      value={{
        user: { ...user, name, email: user.email ?? null },
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

type ParticipantOrComment = {
  userId: string | null;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export const withSession = <P extends {} = {}>(
  component: React.ComponentType<P>,
) => {
  const ComposedComponent: React.FunctionComponent<P> = (props: P) => {
    const Component = component;
    return (
      <UserProvider>
        <Component {...props} />
      </UserProvider>
    );
  };
  ComposedComponent.displayName = `withUser(${component.displayName})`;
  return ComposedComponent;
};

/**
 * @deprecated Stop using this function. All object
 */
export const isUnclaimed = (obj: ParticipantOrComment) => !obj.userId;
