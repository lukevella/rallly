import { usePoll } from "@/contexts/poll";
import { useRole } from "@/contexts/role";

export const IfParticipantsVisible = (props: React.PropsWithChildren) => {
  const role = useRole();
  const poll = usePoll();
  if (role === "participant" && poll.hideParticipants) {
    return null;
  }

  return <>{props.children}</>;
};

export const IfHiddenParticipants = (props: React.PropsWithChildren) => {
  const role = useRole();
  const poll = usePoll();

  if (role === "participant" && poll.hideParticipants) {
    return <>{props.children}</>;
  }

  return null;
};
