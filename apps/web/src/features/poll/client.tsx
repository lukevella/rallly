"use client";
import React from "react";
import { useRequiredContext } from "@/components/use-required-context";
import type {
  OidcVotingState,
  PollComment,
  PollDetails,
  PollParticipant,
} from "@/features/poll/types";
import { useUser } from "@/features/user/client";
import { useTranslation } from "@/i18n/client";

type PollContextValue = {
  poll: PollDetails;
  participants: PollParticipant[];
  comments: PollComment[];
  /**
   * Responses the emailed link in the URL may edit, resolved on the server
   * from the same token the actions check.
   */
  linkedParticipantIds: string[];
  /** Which surface the page is: the host's admin page or the invite page. */
  viewerRole: "admin" | "participant";
  /**
   * Resolved on the server from `REQUIRE_OIDC_TO_VOTE` and the viewer's
   * session: "signInRequired" hides voting until the viewer signs in through
   * OIDC, "identityLocked" means the response is recorded under the IdP name
   * and email, so the form shows them read-only.
   */
  oidcVoting: OidcVotingState;
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
  viewerRole,
  oidcVoting = "off",
  children,
}: Omit<PollContextValue, "linkedParticipantIds" | "oidcVoting"> & {
  linkedParticipantIds?: string[];
  oidcVoting?: PollContextValue["oidcVoting"];
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({
      poll,
      participants,
      comments,
      linkedParticipantIds,
      viewerRole,
      oidcVoting,
    }),
    [
      poll,
      participants,
      comments,
      linkedParticipantIds,
      viewerRole,
      oidcVoting,
    ],
  );

  return <PollContext.Provider value={value}>{children}</PollContext.Provider>;
}

export const usePoll = () => useRequiredContext(PollContext).poll;

/** The poll when a provider is mounted, for components shared with pages
 * that pass their data as props instead. */
export const usePollOrNull = () => React.useContext(PollContext)?.poll ?? null;

export const useRole = () => useRequiredContext(PollContext).viewerRole;

/** "off" when no provider is mounted, like `usePollOrNull`. */
export const useOidcVoting = () =>
  React.useContext(PollContext)?.oidcVoting ?? "off";

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
  const { poll, participants, linkedParticipantIds, viewerRole, oidcVoting } =
    useRequiredContext(PollContext);
  const { user } = useUser();

  return {
    canAddNewParticipant:
      poll.status === "open" && oidcVoting !== "signInRequired",
    canEditParticipant: (participantId: string) => {
      if (poll.status !== "open") {
        return false;
      }

      if (viewerRole === "admin") {
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
