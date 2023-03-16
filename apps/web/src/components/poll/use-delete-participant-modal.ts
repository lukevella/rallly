import { useTranslation } from "next-i18next";

import { useModalContext } from "../modal/modal-provider";
import { usePoll } from "../poll-context";
import { useDeleteParticipantMutation } from "./mutations";

export const useDeleteParticipantModal = () => {
  const { render } = useModalContext();

  const deleteParticipant = useDeleteParticipantMutation();
  const { poll } = usePoll();

  const { t } = useTranslation("app");

  return (participantId: string, participantName: string) => {
    return render({
      title: t("deleteParticipant", { name: participantName }),
      description: t("deleteParticipantDescription"),
      okButtonProps: {
        type: "danger",
      },
      okText: t("delete"),
      onOk: () => {
        deleteParticipant.mutate({
          pollId: poll.id,
          participantId,
        });
      },
      overlayClosable: true,
      cancelText: t("cancel"),
    });
  };
};
