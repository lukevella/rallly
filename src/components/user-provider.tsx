import { useTranslation } from "next-i18next";
import React from "react";

import { UserSession } from "@/utils/auth";

import { trpcNext } from "../utils/trpc";
import { useRequiredContext } from "./use-required-context";

export const UserContext =
  React.createContext<{
    user: UserSession & { shortName: string };
    refresh: () => void;
    logout: () => Promise<void>;
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
  const { t } = useTranslation("app");

  const { data: user, refetch } = trpcNext.whoami.get.useQuery();
  const logout = trpcNext.whoami.destroy.useMutation();

  const shortName = user
    ? user.isGuest === false
      ? user.name
      : `${t("guest")}-${user.id.substring(user.id.length - 4)}`
    : t("guest");

  if (!user) {
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        user: { ...user, shortName },
        refresh: refetch,
        ownsObject: ({ userId }) => {
          if (userId && user.id === userId) {
            return true;
          }
          return false;
        },
        logout: async () => {
          await logout.mutateAsync();
          refetch();
        },
      }}
    >
      {props.children}
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
  const ComposedComponent: React.VoidFunctionComponent<P> = (props: P) => {
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
