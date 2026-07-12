"use client";
import { useParams, usePathname } from "next/navigation";
import React from "react";

import { useParticipants } from "@/features/poll/components/participants-provider";
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
  const { data: user } = trpc.user.getMe.useQuery();
  const role = useRole();
  const { participants } = useParticipants();
  return {
    isUser: (userId: string) =>
      userId === user?.id || userId === context.impersonatedUserId,
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
        participant.userId === user?.id ||
        (context.impersonatedUserId &&
          participant.userId === context.impersonatedUserId)
      ) {
        return true;
      }

      return false;
    },
  };
};
