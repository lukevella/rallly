import { useModalContext } from "../modal/modal-provider";
import { usePoll } from "../poll-context";
import { useDeleteParticipantMutation } from "./mutations";

export const useDeleteParticipantModal = () => {
  const { render } = useModalContext();

  const deleteParticipant = useDeleteParticipantMutation();
  const { poll } = usePoll();

  return (participantId: string) => {
    return render({
      title: "Delete participant?",
      description:
        "Are you sure you want to remove this participant from the poll?",
      okButtonProps: {
        type: "danger",
      },
      okText: "Delete",
      onOk: () => {
        deleteParticipant.mutate({
          pollId: poll.id,
          participantId,
        });
      },
      cancelText: "Cancel",
    });
  };
};
