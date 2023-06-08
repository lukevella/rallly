import { useParticipants } from "@/components/participants-provider";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";
import { useRole } from "@/contexts/role";

export const usePermissions = () => {
  const poll = usePoll();
  const { user } = useUser();
  const role = useRole();
  const { participants } = useParticipants();
  const isClosed = poll.closed === true || poll.selectedOptionId !== null;
  return {
    canAddNewParticipant: !isClosed,
    canEditParticipant: (participantId: string) => {
      if (isClosed) {
        return false;
      }

      if (role === "admin") {
        return true;
      }

      const participant = participants.find(
        (participant) => participant.id === participantId,
      );

      if (participant && participant.userId === user.id) {
        return true;
      }

      return false;
    },
  };
};
