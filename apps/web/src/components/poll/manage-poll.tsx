import { Placement } from "@floating-ui/react-dom-interactions";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import { Button } from "@/components/button";
import Cog from "@/components/icons/cog.svg";
import LockClosed from "@/components/icons/lock-closed.svg";
import LockOpen from "@/components/icons/lock-open.svg";
import Pencil from "@/components/icons/pencil-alt.svg";
import Save from "@/components/icons/save.svg";
import Table from "@/components/icons/table.svg";
import Trash from "@/components/icons/trash.svg";
import { encodeDateOption } from "@/utils/date-time-utils";

import Dropdown, { DropdownItem } from "../dropdown";
import { PollDetailsForm } from "../forms";
import { useModal } from "../modal";
import { useModalContext } from "../modal/modal-provider";
import { usePoll } from "../poll-context";
import { DeletePollForm } from "./manage-poll/delete-poll-form";
import { useCsvExporter } from "./manage-poll/use-csv-exporter";
import { useUpdatePollMutation } from "./mutations";

const PollOptionsForm = React.lazy(() => import("../forms/poll-options-form"));

const ManagePoll: React.FunctionComponent<{
  placement?: Placement;
}> = ({ placement }) => {
  const { t } = useTranslation("app");
  const { poll, getParticipantsWhoVotedForOption, urlId } = usePoll();

  const { exportToCsv } = useCsvExporter();

  const modalContext = useModalContext();

  const handleChangeOptions = () => {
    if (poll.legacy) {
      modalContext.render({
        overlayClosable: true,
        title: "Sorry!",
        description:
          "This poll was created with an older version of Rallly and does not support this feature.",
        cancelText: "Close",
      });
    } else {
      openChangeOptionsModal();
    }
  };

  const { mutate: updatePollMutation, isLoading: isUpdating } =
    useUpdatePollMutation();
  const [
    changeOptionsModalContextHolder,
    openChangeOptionsModal,
    closeChangeOptionsModal,
  ] = useModal({
    okText: t("save"),
    okButtonProps: {
      form: "pollOptions",
      htmlType: "submit",
      loading: isUpdating,
    },
    cancelText: t("cancel"),
    content: (
      <React.Suspense fallback={null}>
        <PollOptionsForm
          name="pollOptions"
          title={poll.title}
          defaultValues={{
            navigationDate: poll.options[0].value.split("/")[0],
            options: poll.options.map((option) => {
              const [start, end] = option.value.split("/");
              return end
                ? {
                    type: "timeSlot",
                    start,
                    end,
                  }
                : {
                    type: "date",
                    date: start,
                  };
            }),
            timeZone: poll.timeZone ?? "",
          }}
          onSubmit={(data) => {
            const encodedOptions = data.options.map(encodeDateOption);
            const optionsToDelete = poll.options.filter((option) => {
              return !encodedOptions.includes(option.value);
            });

            const optionsToAdd = encodedOptions.filter(
              (encodedOption) =>
                !poll.options.find((o) => o.value === encodedOption),
            );

            const onOk = () => {
              updatePollMutation(
                {
                  urlId: urlId,
                  timeZone: data.timeZone,
                  optionsToDelete: optionsToDelete.map(({ id }) => id),
                  optionsToAdd,
                },
                {
                  onSuccess: () => closeChangeOptionsModal(),
                },
              );
            };

            const optionsToDeleteThatHaveVotes = optionsToDelete.filter(
              (option) =>
                getParticipantsWhoVotedForOption(option.id).length > 0,
            );

            if (optionsToDeleteThatHaveVotes.length > 0) {
              modalContext.render({
                title: t("areYouSure"),
                description: (
                  <Trans
                    t={t}
                    i18nKey="deletingOptionsWarning"
                    components={{ b: <strong /> }}
                  />
                ),
                onOk,
                okButtonProps: {
                  type: "danger",
                },
                okText: t("delete"),
                cancelText: t("cancel"),
              });
            } else {
              onOk();
            }
          }}
        />
      </React.Suspense>
    ),
  });

  const [
    changePollDetailsModalContextHolder,
    openChangePollDetailsModa,
    closePollDetailsModal,
  ] = useModal({
    okText: t("save"),
    okButtonProps: {
      form: "updateDetails",
      loading: isUpdating,
      htmlType: "submit",
    },
    cancelText: t("cancel"),
    content: (
      <PollDetailsForm
        name="updateDetails"
        defaultValues={{
          title: poll.title,
          location: poll.location ?? "",
          description: poll.description ?? "",
        }}
        className="w-[500px] p-3 sm:p-4"
        onSubmit={(data) => {
          //submit
          updatePollMutation(
            { urlId, ...data },
            { onSuccess: closePollDetailsModal },
          );
        }}
      />
    ),
  });
  return (
    <div>
      {changeOptionsModalContextHolder}
      {changePollDetailsModalContextHolder}
      <Dropdown
        placement={placement}
        trigger={<Button icon={<Cog />}>{t("manage")}</Button>}
      >
        <DropdownItem
          icon={Pencil}
          label={t("editDetails")}
          onClick={openChangePollDetailsModa}
        />
        <DropdownItem
          icon={Table}
          label={t("editOptions")}
          onClick={handleChangeOptions}
        />
        <DropdownItem
          icon={Save}
          label={t("exportToCsv")}
          onClick={exportToCsv}
        />
        {poll.closed ? (
          <DropdownItem
            icon={LockOpen}
            label={t("unlockPoll")}
            onClick={() => updatePollMutation({ urlId, closed: false })}
          />
        ) : (
          <DropdownItem
            icon={LockClosed}
            label={t("lockPoll")}
            onClick={() => updatePollMutation({ urlId, closed: true })}
          />
        )}
        <DropdownItem
          icon={Trash}
          label={t("deletePoll")}
          onClick={() => {
            modalContext.render({
              overlayClosable: true,
              content: function Content({ close }) {
                return (
                  <DeletePollForm
                    onConfirm={async () => {
                      close();
                    }}
                    onCancel={close}
                    urlId={urlId}
                  />
                );
              },
              footer: null,
            });
          }}
        />
      </Dropdown>
    </div>
  );
};

export default ManagePoll;
