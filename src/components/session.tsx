import { IronSessionData } from "iron-session";
import React from "react";

import { trpc } from "@/utils/trpc";

import { useRequiredContext } from "./use-required-context";

export type UserSessionData = NonNullable<IronSessionData["user"]>;

export type SessionProps = {
  user: UserSessionData | null;
};

type ParticipantOrComment = {
  userId: string | null;
  guestId: string | null;
};

type SessionContextValue = {
  logout: () => void;
  user: (UserSessionData & { shortName: string }) | null;
  refresh: () => void;
  ownsObject: (obj: ParticipantOrComment) => boolean;
  isLoading: boolean;
};

export const SessionContext =
  React.createContext<SessionContextValue | null>(null);

SessionContext.displayName = "SessionContext";

export const SessionProvider: React.VoidFunctionComponent<{
  children?: React.ReactNode;
  session: UserSessionData | null;
}> = ({ children, session }) => {
  const queryClient = trpc.useContext();
  const {
    data: user = session,
    refetch,
    isLoading,
  } = trpc.useQuery(["session.get"]);

  const { mutate: logout } = trpc.useMutation(["session.destroy"], {
    onMutate: () => {
      queryClient.setQueryData(["session.get"], null);
    },
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
    logout: () => {
      logout();
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

export const isUnclaimed = (obj: ParticipantOrComment) =>
  !obj.guestId && !obj.userId;
