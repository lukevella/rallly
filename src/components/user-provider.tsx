import useTranslation from "next-translate/useTranslation";
import React from "react";

import { UserSession } from "@/utils/auth";

import { trpcNext } from "../utils/trpc";
import { useRequiredContext } from "./use-required-context";

export const UserContext =
  React.createContext<{
    user: UserSession;
    alias: string;
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

  const alias = user
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
        user,
        alias,
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
