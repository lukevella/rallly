import React from "react";

import { useParticipants } from "@/components/participants-provider";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";
import { useRole } from "@/contexts/role";

export const PermissionsContext = React.createContext<{
  userId: string | null;
}>({
  userId: null,
});

export const usePermissions = () => {
  const poll = usePoll();
  const context = React.useContext(PermissionsContext);
  const { user } = useUser();
  const role = useRole();
  const { participants } = useParticipants();
  const isClosed = poll.closed === true || poll.event !== null;
  return {
    isUser: (userId: string) => userId === user.id || userId === context.userId,
    canAddNewParticipant: !isClosed,
    canEditParticipant: (participantId: string) => {
      if (isClosed) {
        return false;
      }

      if (role === "admin" && user.id === poll.userId) {
        return true;
      }

      const participant = participants.find(
        (participant) => participant.id === participantId,
      );

      if (
        participant &&
        (participant.userId === user.id ||
          participant.userId === context.userId)
      ) {
        return true;
      }

      return false;
    },
  };
};
