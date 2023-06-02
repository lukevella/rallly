import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  LockIcon,
  PencilIcon,
  SettingsIcon,
  TableIcon,
  TrashIcon,
  UnlockIcon,
} from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIconLabel,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import dayjs from "dayjs";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import { FinalizePollDialog } from "@/components/poll/manage-poll/finalize-poll-dialog";
import { encodeDateOption } from "@/utils/date-time-utils";

import { PollDetailsForm } from "../forms";
import { useModal } from "../modal";
import { useModalContext } from "../modal/modal-provider";
import { usePoll } from "../poll-context";
import { DeletePollDialog } from "./manage-poll/delete-poll-dialog";
import { useCsvExporter } from "./manage-poll/use-csv-exporter";
import { useUpdatePollMutation } from "./mutations";

const PollOptionsForm = React.lazy(() => import("../forms/poll-options-form"));

const convertOptionToString = (option: { start: Date; duration: number }) => {
  const start = dayjs(option.start).utc();
  return option.duration === 0
    ? start.format("YYYY-MM-DD")
    : `${start.format("YYYY-MM-DDTHH:mm:ss")}/${start
        .add(option.duration, "minute")
        .format("YYYY-MM-DDTHH:mm:ss")}`;
};

const ManagePoll: React.FunctionComponent<{
  disabled?: boolean;
}> = ({ disabled }) => {
  const { t } = useTranslation();
  const { poll, getParticipantsWhoVotedForOption, urlId } = usePoll();

  const [showDeletePollDialog, setShowDeletePollDialog] = React.useState(false);
  const [isFinalizeDialogVisible, setIsFinalizeDialogVisible] =
    React.useState(false);

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
            navigationDate: dayjs(poll.options[0].start)
              .utc()
              .format("YYYY-MM-DD"),
            options: poll.options.map((option) => {
              const start = dayjs(option.start).utc();
              return option.duration > 0
                ? {
                    type: "timeSlot",
                    start: start.format("YYYY-MM-DDTHH:mm:ss"),
                    end: start
                      .add(option.duration, "minute")
                      .format("YYYY-MM-DDTHH:mm:ss"),
                  }
                : {
                    type: "date",
                    date: start.format("YYYY-MM-DD"),
                  };
            }),
            timeZone: poll.timeZone ?? "",
          }}
          onSubmit={(data) => {
            const encodedOptions = data.options.map(encodeDateOption);
            const optionsToDelete = poll.options.filter((option) => {
              return !encodedOptions.includes(convertOptionToString(option));
            });

            const optionsToAdd = encodedOptions.filter(
              (encodedOption) =>
                !poll.options.find(
                  (o) => convertOptionToString(o) === encodedOption,
                ),
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
    <>
      {changeOptionsModalContextHolder}
      {changePollDetailsModalContextHolder}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild={true}>
          <Button icon={SettingsIcon} disabled={disabled}>
            <Trans i18nKey="manage" />
            <ChevronDownIcon className="h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openChangePollDetailsModa}>
            <DropdownMenuItemIconLabel icon={PencilIcon}>
              <Trans i18nKey="editDetails" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleChangeOptions}>
            <DropdownMenuItemIconLabel icon={TableIcon}>
              <Trans i18nKey="editOptions" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToCsv}>
            <DropdownMenuItemIconLabel icon={DownloadIcon}>
              <Trans i18nKey="exportToCsv" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
          {poll.closed ? (
            <DropdownMenuItem
              onClick={() => updatePollMutation({ urlId, closed: false })}
            >
              <DropdownMenuItemIconLabel icon={UnlockIcon}>
                <Trans i18nKey="unlockPoll" />
              </DropdownMenuItemIconLabel>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => updatePollMutation({ urlId, closed: true })}
            >
              <DropdownMenuItemIconLabel icon={LockIcon}>
                <Trans i18nKey="lockPoll" />
              </DropdownMenuItemIconLabel>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => {
              setIsFinalizeDialogVisible(true);
            }}
          >
            <DropdownMenuItemIconLabel icon={CheckIcon}>
              <Trans i18nKey="finalize" defaults="Finalize" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setShowDeletePollDialog(true);
            }}
          >
            <DropdownMenuItemIconLabel icon={TrashIcon}>
              <Trans i18nKey="deletePoll" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <FinalizePollDialog
        open={isFinalizeDialogVisible}
        onOpenChange={setIsFinalizeDialogVisible}
      />
      <DeletePollDialog
        urlId={urlId}
        open={showDeletePollDialog}
        onOpenChange={setShowDeletePollDialog}
      />
    </>
  );
};

export default ManagePoll;
