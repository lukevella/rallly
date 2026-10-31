"use client";
import React from "react";
import { useRequiredContext } from "@/components/use-required-context";
import type { PollInviteListItem } from "@/features/poll/invite/types";
import type {
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
  /** Everyone invited by email, for the host's pages */
  invites: PollInviteListItem[];
  addInvite: (invite: PollInviteListItem) => void;
  removeInvite: (inviteId: string) => void;
};

// Stable, so a provider without invites doesn't reset its list every render
const NO_INVITES: PollInviteListItem[] = [];

const PollContext = React.createContext<PollContextValue | null>(null);

PollContext.displayName = "PollProvider";

/**
 * Serves the poll a page loaded on the server. Writes go through server
 * actions followed by router.refresh(), which re-renders the page with new
 * props. Invites are the exception: sending or revoking one patches the
 * list here from the action's result, so inviting doesn't re-render the
 * whole page. Fresh props from the server replace the patched list.
 */
export function PollProvider({
  poll,
  participants,
  comments,
  linkedParticipantIds = [],
  invites: serverInvites = NO_INVITES,
  viewerRole,
  children,
}: Omit<
  PollContextValue,
  "linkedParticipantIds" | "invites" | "addInvite" | "removeInvite"
> & {
  linkedParticipantIds?: string[];
  invites?: PollInviteListItem[];
  children: React.ReactNode;
}) {
  const [invites, setInvites] = React.useState(serverInvites);
  const [syncedInvites, setSyncedInvites] = React.useState(serverInvites);
  if (serverInvites !== syncedInvites) {
    setSyncedInvites(serverInvites);
    setInvites(serverInvites);
  }
  const addInvite = React.useCallback(
    (invite: PollInviteListItem) =>
      setInvites((prev) => [
        invite,
        ...prev.filter((existing) => existing.id !== invite.id),
      ]),
    [],
  );
  const removeInvite = React.useCallback(
    (inviteId: string) =>
      setInvites((prev) => prev.filter((invite) => invite.id !== inviteId)),
    [],
  );

  const value = React.useMemo(
    () => ({
      poll,
      participants,
      comments,
      linkedParticipantIds,
      viewerRole,
      invites,
      addInvite,
      removeInvite,
    }),
    [
      poll,
      participants,
      comments,
      linkedParticipantIds,
      viewerRole,
      invites,
      addInvite,
      removeInvite,
    ],
  );

  return <PollContext.Provider value={value}>{children}</PollContext.Provider>;
}

export const usePoll = () => useRequiredContext(PollContext).poll;

/** The poll when a provider is mounted, for components shared with pages
 * that pass their data as props instead. */
export const usePollOrNull = () => React.useContext(PollContext)?.poll ?? null;

export const useRole = () => useRequiredContext(PollContext).viewerRole;

export const useComments = () => useRequiredContext(PollContext).comments;

/** Everyone invited by email, kept current as the host sends and revokes. */
export const usePollInvites = () => useRequiredContext(PollContext).invites;

/** Patches the invite list from an action's result. */
export const usePollInviteUpdates = () => {
  const { addInvite, removeInvite } = useRequiredContext(PollContext);
  return { addInvite, removeInvite };
};

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
  const { poll, participants, linkedParticipantIds, viewerRole } =
    useRequiredContext(PollContext);
  const { user } = useUser();

  return {
    canAddNewParticipant: poll.status === "open",
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
