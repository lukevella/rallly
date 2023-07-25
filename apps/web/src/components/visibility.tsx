/**
 * Manage what the user can and cannot see on the page
 */
import React from "react";

import { useParticipants } from "@/components/participants-provider";
import { usePermissions } from "@/contexts/permissions";
import { usePoll } from "@/contexts/poll";

export const IfParticipantsVisible = (props: React.PropsWithChildren) => {
  const context = React.useContext(VisibilityContext);

  if (context.canSeeOtherParticipants) {
    return <>{props.children}</>;
  }

  return null;
};

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
  canSeeOtherParticipants: boolean;
  canSeeScores: boolean;
}>({
  canSeeScores: true,
  canSeeOtherParticipants: true,
});

export const VisibilityProvider = ({ children }: React.PropsWithChildren) => {
  const poll = usePoll();
  const { participants } = useParticipants();
  const { canEditParticipant } = usePermissions();
  const userAlreadyVoted = participants.some((participant) => {
    return canEditParticipant(participant.id);
  });

  const canSeeScores = poll.hideScores ? userAlreadyVoted : true;
  const canSeeOtherParticipants = poll.hideParticipants ? false : canSeeScores;

  return (
    <VisibilityContext.Provider
      value={{
        canSeeOtherParticipants,
        canSeeScores,
      }}
    >
      {children}
    </VisibilityContext.Provider>
  );
};
