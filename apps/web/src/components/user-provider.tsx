import { trpc, UserSession } from "@rallly/backend";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import { TimeFormatPicker } from "@/components/time-format-picker";
import { PostHogProvider } from "@/contexts/posthog";
import { useUserPreferences } from "@/contexts/preferences";
import { useDayjs } from "@/utils/dayjs";

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
  const { data: user } = trpc.whoami.get.useQuery(undefined, {
    cacheTime: Infinity,
    staleTime: Infinity,
  });

  const router = useRouter();
  const logout = trpc.whoami.destroy.useMutation({
    onSuccess: async () => {
      router.push("/logout");
    },
  });

  const preferences = useUserPreferences();

  const shortName = user
    ? user.isGuest === false
      ? user.name.split(" ")[0]
      : user.id.substring(0, 10)
    : t("guest");

  if (!user || preferences === undefined) {
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
          return userId ? [user.id, props.forceUserId].includes(userId) : false;
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

export const UserPreferredTimeFormatPicker = () => {
  const { data: userPreferences } = trpc.userPreferences.get.useQuery();
  const { timeFormat: localeTimeFormat } = useDayjs();
  const update = trpc.userPreferences.update.useMutation({
    onMutate: (newPreferences) => {
      queryClient.userPreferences.get.setData(undefined, (existingData) =>
        existingData
          ? {
              ...existingData,
              timeFormat: newPreferences.timeFormat ?? null,
            }
          : null,
      );
    },
  });

  const queryClient = trpc.useContext();

  const timeFormat = userPreferences?.timeFormat ?? localeTimeFormat;
  return (
    <TimeFormatPicker
      value={timeFormat}
      onChange={(timeFormat) => {
        update.mutate({
          timeFormat,
        });
      }}
    />
  );
};
