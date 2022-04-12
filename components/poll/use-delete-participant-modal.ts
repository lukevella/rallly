import { useModal } from "../modal";
import { useDeleteParticipantMutation } from "./mutations";

export const useDeleteParticipantModal = (
  pollId: string,
  participantId: string,
) => {
  const { mutate: deleteParticipant } = useDeleteParticipantMutation(pollId);
  return useModal({
    title: "Delete participant?",
    description:
      "Are you sure you want to remove this participant from the poll?",
    okButtonProps: {
      type: "danger",
    },
    okText: "Remove",
    onOk: () => {
      deleteParticipant({
        pollId: pollId,
        participantId,
      });
    },
    cancelText: "Cancel",
  });
};
