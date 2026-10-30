"use client";
/**
 * Manage what the user can and cannot see on the page
 */
import React from "react";
import {
  useParticipants,
  usePermissions,
  usePoll,
  useRole,
} from "@/features/poll/client";

export const IfScoresVisible = (props: React.PropsWithChildren) => {
  const context = React.useContext(VisibilityContext);

  if (context.canSeeScores) {
    return <>{props.children}</>;
  }

  return null;
};

export const useVisibility = () => {
  return React.useContext(VisibilityContext);
};

const VisibilityContext = React.createContext<{
  canSeeScores: boolean;
}>({
  canSeeScores: true,
});

/**
 * The viewer's own responses and the ones they may edit. With hideScores,
 * other people's responses are kept from a viewer until they respond.
 */
export const useVisibleParticipants = () => {
  const { canSeeScores } = useVisibility();
  const { canEditParticipant, isOwnParticipant } = usePermissions();
  const { participants } = useParticipants();

  const filteredParticipants = React.useMemo(() => {
    if (!canSeeScores) {
      return participants.filter(
        (participant) =>
          isOwnParticipant(participant.id) ||
          canEditParticipant(participant.id),
      );
    }
    return participants;
  }, [canEditParticipant, isOwnParticipant, canSeeScores, participants]);

  return filteredParticipants;
};

/**
 * Decides whether the viewer sees vote totals. With hideScores they appear
 * once the viewer has a response of their own (or one they may edit). The
 * host of an aggregate results poll has no response to hold, and the totals
 * are all they are shown, so they always see them.
 */
export const VisibilityProvider = ({ children }: React.PropsWithChildren) => {
  const poll = usePoll();
  const role = useRole();
  const { participants } = useParticipants();
  const { canEditParticipant, isOwnParticipant } = usePermissions();
  const userAlreadyVoted = participants.some((participant) => {
    return (
      isOwnParticipant(participant.id) || canEditParticipant(participant.id)
    );
  });

  const canSeeScores =
    !poll.hideScores ||
    userAlreadyVoted ||
    (!!poll.aggregateResultsOnly && role === "admin");

  return (
    <VisibilityContext.Provider
      value={{
        canSeeScores,
      }}
    >
      {children}
    </VisibilityContext.Provider>
  );
};
