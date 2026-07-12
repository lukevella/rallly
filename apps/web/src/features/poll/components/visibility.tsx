/**
 * Manage what the user can and cannot see on the page
 */
import React from "react";
import { usePermissions, usePoll } from "@/features/poll/client";
import { useParticipants } from "@/features/poll/components/participants-provider";

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

export const useVisibleParticipants = () => {
  const { canSeeScores } = useVisibility();
  const { canEditParticipant } = usePermissions();
  const { participants } = useParticipants();

  const filteredParticipants = React.useMemo(() => {
    if (!canSeeScores) {
      return participants.filter((participant) =>
        canEditParticipant(participant.id),
      );
    }
    return participants;
  }, [canEditParticipant, canSeeScores, participants]);

  return filteredParticipants;
};

export const VisibilityProvider = ({ children }: React.PropsWithChildren) => {
  const poll = usePoll();
  const { participants } = useParticipants();
  const { canEditParticipant } = usePermissions();
  const userAlreadyVoted = participants.some((participant) => {
    return canEditParticipant(participant.id);
  });

  const canSeeScores = poll.hideScores ? userAlreadyVoted : true;

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
