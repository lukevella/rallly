"use client";
import React from "react";
import { useRequiredContext } from "@/components/use-required-context";
import type {
  PollComment,
  PollDetails,
  PollParticipant,
} from "@/features/poll/types";
import { isOptionPast } from "@/features/poll/utils";
import { useUser } from "@/features/user/client";
import { useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { useHydrated } from "@/lib/datetime/use-hydrated";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";

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

/**
 * Which of `options` are over for this viewer and can no longer be voted on.
 * Re-read every minute, so an option that ends while the page is open greys
 * out. Empty until hydration: the server render cannot know the viewer's
 * clock or zone.
 */
export const usePastOptions = (
  options: { id: string; startTime: Date; duration: number }[],
  pollTimeZone: string | null,
) => {
  const { timeZone } = useDateTimeConfig();
  const hydrated = useHydrated();
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return React.useMemo(() => {
    if (!hydrated) {
      return new Set<string>();
    }
    const viewerTimeZone = timeZone ?? getBrowserTimeZone();
    return new Set(
      options
        .filter((option) =>
          isOptionPast(option, { pollTimeZone, viewerTimeZone, now }),
        )
        .map((option) => option.id),
    );
  }, [hydrated, now, options, pollTimeZone, timeZone]);
};

export const usePastOptionIds = () => {
  const poll = usePoll();
  return usePastOptions(poll.options, poll.timeZone);
};

/** Nothing left to answer: the server refuses a new response too. */
export const useAllOptionsPast = () => {
  const poll = usePoll();
  const pastOptionIds = usePastOptionIds();
  return poll.options.length > 0 && pastOptionIds.size === poll.options.length;
};

export const usePermissions = () => {
  const { poll, participants, linkedParticipantIds, viewerRole } =
    useRequiredContext(PollContext);
  const { user } = useUser();
  const allOptionsPast = useAllOptionsPast();

  return {
    canAddNewParticipant: poll.status === "open" && !allOptionsPast,
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
