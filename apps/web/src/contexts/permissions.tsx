"use client";
import React from "react";

import { useParticipants } from "@/components/participants-provider";
import { usePoll } from "@/contexts/poll";
import { useRole } from "@/contexts/role";
import { authClient } from "@/lib/auth-client";

const PermissionsContext = React.createContext<{
  impersonatedUserId: string | null;
}>({
  impersonatedUserId: null,
});

export const PermissionProvider = ({
  children,
  impersonatedUserId,
}: {
  children: React.ReactNode;
  impersonatedUserId: string | null;
}) => {
  return (
    <PermissionsContext.Provider value={{ impersonatedUserId }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const poll = usePoll();
  const context = React.useContext(PermissionsContext);
  const { data: session } = authClient.useSession();
  const role = useRole();
  const { participants } = useParticipants();
  return {
    isUser: (userId: string) =>
      userId === session?.user?.id || userId === context.impersonatedUserId,
    canAddNewParticipant: poll.status === "open",
    canEditParticipant: (participantId: string) => {
      if (poll.status !== "open") {
        return false;
      }

      if (role === "admin") {
        return true;
      }

      const participant = participants.find(
        (participant) => participant.id === participantId,
      );

      if (!participant) {
        return false;
      }

      if (
        participant.userId === session?.user?.id ||
        (context.impersonatedUserId &&
          participant.userId === context.impersonatedUserId)
      ) {
        return true;
      }

      return false;
    },
  };
};
