import { trpc, UserSession } from "@rallly/backend";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import { PostHogProvider } from "@/contexts/posthog";

import { useRequiredContext } from "./use-required-context";

export const UserContext = React.createContext<{
  user: UserSession & { shortName: string };
  refresh: () => void;
  logout: () => void;
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

export const UserProvider = (props: {
  children?: React.ReactNode;
  forceUserId?: string;
}) => {
  const { t } = useTranslation();

  const queryClient = trpc.useContext();
  const { data: user } = trpc.whoami.get.useQuery();

  const router = useRouter();
  const logout = trpc.whoami.destroy.useMutation({
    onSuccess: async () => {
      router.push("/logout");
    },
  });

  const shortName = user
    ? user.isGuest === false
      ? user.name
      : user.id.substring(0, 10)
    : t("guest");

  if (!user) {
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        user: { ...user, shortName },
        refresh: () => {
          return queryClient.whoami.invalidate();
        },
        ownsObject: ({ userId }) => {
          if (
            (userId && user.id === userId) ||
            (props.forceUserId && props.forceUserId === userId)
          ) {
            return true;
          }
          return false;
        },
        logout: () => {
          logout.mutate();
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
