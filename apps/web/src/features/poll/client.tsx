"use client";
import { useParams, usePathname } from "next/navigation";
import React from "react";

import { useParticipants } from "@/features/poll/components/participants-provider";
import { useUser } from "@/features/user/client";
import { trpc } from "@/trpc/client";

export const usePoll = () => {
  const params = useParams<{ urlId: string }>();
  const [poll] = trpc.polls.get.useSuspenseQuery({
    urlId: params?.urlId as string,
  });

  return poll;
};

export const useRole = () => {
  const pathname = usePathname();
  return pathname?.includes("/poll") ? "admin" : "participant";
};

/**
 * Responses the emailed link in the URL may edit, resolved on the server
 * from the same token the tRPC routes check.
 */
const PermissionsContext = React.createContext<{
  linkedParticipantIds: string[];
}>({
  linkedParticipantIds: [],
});

export const PermissionProvider = ({
  children,
  linkedParticipantIds,
}: {
  children: React.ReactNode;
  linkedParticipantIds: string[];
}) => {
  return (
    <PermissionsContext.Provider value={{ linkedParticipantIds }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const poll = usePoll();
  const context = React.useContext(PermissionsContext);
  const { user } = useUser();
  const role = useRole();
  const { participants } = useParticipants();
  return {
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

      return (
        (!!user && participant.userId === user.id) ||
        context.linkedParticipantIds.includes(participantId)
      );
    },
  };
};
