import { IronSessionData } from "iron-session";
import React from "react";
import toast from "react-hot-toast";

import { trpc } from "@/utils/trpc";

import FullPageLoader from "./full-page-loader";
import { useRequiredContext } from "./use-required-context";

export type UserSessionData = NonNullable<IronSessionData["user"]>;

export type SessionProps = {
  user: UserSessionData;
};

type ParticipantOrComment = {
  userId: string | null;
};

export type UserSessionDataExtended =
  | {
      isGuest: true;
      id: string;
      shortName: string;
    }
  | {
      isGuest: false;
      id: string;
      name: string;
      shortName: string;
      email: string;
    };

type SessionContextValue = {
  logout: () => void;
  user: UserSessionDataExtended;
  refresh: () => void;
  ownsObject: (obj: ParticipantOrComment) => boolean;
  isLoading: boolean;
};

export const SessionContext =
  React.createContext<SessionContextValue | null>(null);

SessionContext.displayName = "SessionContext";

export const SessionProvider: React.VoidFunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const queryClient = trpc.useContext();
  const { data: user, refetch, isLoading } = trpc.useQuery(["session.get"]);

  const logout = trpc.useMutation(["session.destroy"], {
    onSuccess: () => {
      queryClient.invalidateQueries(["session.get"]);
    },
  });

  if (!user) {
    return <FullPageLoader>Loading user…</FullPageLoader>;
  }

  const sessionData: SessionContextValue = {
    user: {
      ...user,
      shortName:
        // try to get the first name in the event
        // that the user entered a full name
        user.isGuest
          ? user.id.substring(0, 10)
          : user.name.length > 12 && user.name.indexOf(" ") !== -1
          ? user.name.substring(0, user.name.indexOf(" "))
          : user.name,
    },
    refresh: () => {
      refetch();
    },
    isLoading,
    logout: () => {
      toast.promise(logout.mutateAsync(), {
        loading: "Logging out…",
        success: "Logged out",
        error: "Failed to log out",
      });
    },
    ownsObject: (obj) => {
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
      <SessionProvider>
        <Component {...props} />
      </SessionProvider>
    );
  };
  ComposedComponent.displayName = component.displayName;
  return ComposedComponent;
};

export const isUnclaimed = (obj: ParticipantOrComment) => !obj.userId;
