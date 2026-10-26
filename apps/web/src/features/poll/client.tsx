"use client";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import { useRequiredContext } from "@/components/use-required-context";
import type {
  PollComment,
  PollDetails,
  PollParticipant,
} from "@/features/poll/types";
import { closesAtFromField, hasPassedClosesAt } from "@/features/poll/utils";
import { useUser } from "@/features/user/client";
import { useTranslation } from "@/i18n/client";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";

/**
 * Reads the closing-time date and time fields as the organizer's browser
 * zone sees them. Returns `{ ok: false }` after toasting when the time is in
 * the past, so a form can stop its submit; `closesAt` is undefined when the
 * fields are empty.
 */
export function useResolveClosesAt() {
  const { t } = useTranslation();

  return React.useCallback(
    (date: string | undefined, time: string | undefined) => {
      const closesAt = closesAtFromField(date, time, getBrowserTimeZone());

      if (closesAt && hasPassedClosesAt(closesAt)) {
        toast.error(
          t("closesAtInPast", {
            defaultValue: "The closing time must be in the future",
          }),
        );
        return { ok: false as const };
      }

      return { ok: true as const, closesAt };
    },
    [t],
  );
}

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
  children,
}: Omit<PollContextValue, "linkedParticipantIds"> & {
  linkedParticipantIds?: string[];
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({ poll, participants, comments, linkedParticipantIds, viewerRole }),
    [poll, participants, comments, linkedParticipantIds, viewerRole],
  );

  return <PollContext.Provider value={value}>{children}</PollContext.Provider>;
}

export const usePoll = () => useRequiredContext(PollContext).poll;

/** The poll when a provider is mounted, for components shared with pages
 * that pass their data as props instead. */
export const usePollOrNull = () => React.useContext(PollContext)?.poll ?? null;

export const useRole = () => useRequiredContext(PollContext).viewerRole;

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
