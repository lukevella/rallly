"use client";
import { useSearchParams } from "next/navigation";
import React from "react";

import { useParticipants } from "@/components/participants-provider";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";
import { useRole } from "@/contexts/role";
import { trpc } from "@/trpc/client";

const PermissionsContext = React.createContext<{
  userId: string | null;
}>({
  userId: null,
});

export const PermissionProvider = ({
  children,
}: React.PropsWithChildren) => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { data } = trpc.auth.getUserPermission.useQuery(
    { token: token ?? "" },
    { enabled: !!token },
  );

  const userId = data?.userId ?? null;

  return (
    <PermissionsContext.Provider value={{ userId }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const poll = usePoll();
  const context = React.useContext(PermissionsContext);
  const { user, ownsObject } = useUser();
  const role = useRole();
  const { participants } = useParticipants();
  return {
    isUser: (userId: string) =>
      userId === user?.id || userId === context.userId,
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
        ownsObject(participant) ||
        (context.userId &&
          (participant.userId === context.userId ||
            participant.guestId === context.userId))
      ) {
        return true;
      }

      return false;
    },
  };
};
