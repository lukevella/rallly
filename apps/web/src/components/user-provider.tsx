import { trpc, UserSession } from "@rallly/backend";
import { useTranslation } from "next-i18next";
import React from "react";

import { PostHogProvider } from "@/contexts/posthog";
import { useWhoAmI } from "@/contexts/whoami";
import { isSelfHosted } from "@/utils/constants";

import { useRequiredContext } from "./use-required-context";

export const UserContext = React.createContext<{
  user: UserSession & { name: string };
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

  const queryClient = trpc.useContext();

  const user = useWhoAmI();
  const { data: userPreferences } = trpc.userPreferences.get.useQuery();

  // TODO (Luke Vella) [2023-09-19]: Remove this when we have a better way to query for an active subscription
  trpc.user.subscription.useQuery(undefined, {
    enabled: !isSelfHosted,
  });

  const name = user
    ? user.isGuest === false
      ? user.name
      : user.id.substring(0, 10)
    : t("guest");

  if (!user || userPreferences === undefined) {
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        user: { ...user, name },
        refresh: () => {
          return queryClient.whoami.invalidate();
        },
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
