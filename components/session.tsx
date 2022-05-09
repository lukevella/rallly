import axios from "axios";
import { IronSessionData } from "iron-session";
import React from "react";
import { useQuery, useQueryClient } from "react-query";

import { useRequiredContext } from "./use-required-context";

export type UserSessionData = NonNullable<IronSessionData["user"]>;

export type SessionProps = {
  user: UserSessionData | null;
};

type SessionContextValue = {
  logout: () => Promise<void>;
  user: (UserSessionData & { shortName: string }) | null;
  refresh: () => void;
  ownsObject: (obj: {
    userId: string | null;
    guestId: string | null;
  }) => boolean;
  isLoading: boolean;
};

export const SessionContext =
  React.createContext<SessionContextValue | null>(null);

SessionContext.displayName = "SessionContext";

export const SessionProvider: React.VoidFunctionComponent<{
  children?: React.ReactNode;
  session: UserSessionData | null;
}> = ({ children, session }) => {
  const queryClient = useQueryClient();
  const {
    data: user = session,
    refetch,
    isLoading,
  } = useQuery(["user"], async () => {
    const res = await axios.get<{ user: UserSessionData | null }>("/api/user");
    return res.data.user;
  });

  const sessionData: SessionContextValue = {
    user: user
      ? {
          ...user,
          shortName:
            // try to get the first name in the event
            // that the user entered a full name
            user.isGuest
              ? user.id.substring(0, 12)
              : user.name.length > 12 && user.name.indexOf(" ") !== -1
              ? user.name.substring(0, user.name.indexOf(" "))
              : user.name,
        }
      : null,
    refresh: () => {
      refetch();
    },
    isLoading,
    logout: async () => {
      queryClient.setQueryData(["user"], null);
      await axios.post("/api/logout");
    },
    ownsObject: (obj) => {
      if (!user) {
        return false;
      }

      if (user.isGuest) {
        return obj.guestId === user.id;
      }

      return obj.userId === user.id;
    },
  };

  return (
    <SessionContext.Provider value={sessionData}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  return useRequiredContext(SessionContext);
};

export const withSession = <P extends SessionProps>(
  component: React.ComponentType<P>,
) => {
  const ComposedComponent: React.VoidFunctionComponent<P> = (props: P) => {
    const Component = component;
    return (
      <SessionProvider session={props.user}>
        <Component {...props} />
      </SessionProvider>
    );
  };
  ComposedComponent.displayName = component.displayName;
  return ComposedComponent;
};
