"use client";
import React from "react";
import { useRequiredContext } from "@/components/use-required-context";
import type {
  PollComment,
  PollDetails,
  PollParticipant,
} from "@/features/poll/types";
import { useUser } from "@/features/user/client";
import { useTranslation } from "@/i18n/client";

type PollRole = "admin" | "participant";

type PollContextValue = {
  poll: PollDetails;
  participants: PollParticipant[];
  comments: PollComment[];
  /**
   * Responses the emailed link in the URL may edit, resolved on the server
   * from the same token the actions check.
   */
  linkedParticipantIds: string[];
  role: PollRole;
};

const PollContext = React.createContext<PollContextValue | null>(null);

PollContext.displayName = "PollProvider";

/**
 * Serves the poll a page loaded on the server. Writes go through server
 * actions followed by router.refresh(), which re-renders the page with new
 * props; nothing here is patched on the client.
 */
export function PollProvider({
  poll,
  participants,
  comments,
  linkedParticipantIds = [],
  role,
  children,
}: PollContextValue & { children: React.ReactNode }) {
  const value = React.useMemo(
    () => ({ poll, participants, comments, linkedParticipantIds, role }),
    [poll, participants, comments, linkedParticipantIds, role],
  );

  return <PollContext.Provider value={value}>{children}</PollContext.Provider>;
}

export const usePoll = () => useRequiredContext(PollContext).poll;

export const useRole = () => useRequiredContext(PollContext).role;

export const useComments = () => useRequiredContext(PollContext).comments;

export const useParticipants = () => {
  const { t } = useTranslation();
  const { participants: rawParticipants } = useRequiredContext(PollContext);

  const participants = React.useMemo(() => {
    return rawParticipants.map((participant, index) => {
      if (!participant.hidden) {
        return participant;
      }

      return {
        ...participant,
        name: t("hiddenParticipantName", {
          defaultValue: "Participant #{number}",
          number: rawParticipants.length - index,
        }),
      };
    });
  }, [rawParticipants, t]);

  return { participants };
};

export const usePermissions = () => {
  const { poll, participants, linkedParticipantIds, role } =
    useRequiredContext(PollContext);
  const { user } = useUser();

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
        linkedParticipantIds.includes(participantId)
      );
    },
  };
};
