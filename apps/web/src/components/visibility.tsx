import { usePoll } from "@/contexts/poll";
import { useRole } from "@/contexts/role";

export const IfParticipantsVisible = (props: React.PropsWithChildren) => {
  const role = useRole();
  const poll = usePoll();
  if (role === "participant" && (poll.hideParticipants || poll.hideScores)) {
    return null;
  }

  return <>{props.children}</>;
};

export const IfCommentsEnabled = (props: React.PropsWithChildren) => {
  const poll = usePoll();
  if (poll.disableComments) {
    return null;
  }

  return <>{props.children}</>;
};

export const IfScoresVisible = (props: React.PropsWithChildren) => {
  const role = useRole();
  const poll = usePoll();
  if (role === "participant" && poll.hideScores) {
    return null;
  }

  return <>{props.children}</>;
};
