import { DownloadIcon, PencilIcon, TableIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { Switch } from "@rallly/ui/switch";
import dayjs from "dayjs";
import { Trans, useTranslation } from "next-i18next";
import React from "react";

import { PollDetailsForm } from "@/components/forms/poll-details-form";
import PollOptionsForm from "@/components/forms/poll-options-form";
import { useModal } from "@/components/modal";
import { useModalContext } from "@/components/modal/modal-provider";
import { useCsvExporter } from "@/components/poll/manage-poll/use-csv-exporter";
import { useUpdatePollMutation } from "@/components/poll/mutations";
import { usePoll } from "@/components/poll-context";
import { encodeDateOption } from "@/utils/date-time-utils";

const SidebarSection = (props: React.PropsWithChildren) => {
  return <section className="p-4">{props.children}</section>;
};

const SidebarSectionTitle = (props: React.PropsWithChildren) => {
  return (
    <div className="mb-2 text-sm font-semibold tracking-tight">
      {props.children}
    </div>
  );
};

const SidebarSectionDescription = (props: React.PropsWithChildren) => {
  return (
    <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
      {props.children}
    </p>
  );
};

const convertOptionToString = (option: { start: Date; duration: number }) => {
  const start = dayjs(option.start).utc();
  return option.duration === 0
    ? start.format("YYYY-MM-DD")
    : `${start.format("YYYY-MM-DDTHH:mm:ss")}/${start
        .add(option.duration, "minute")
        .format("YYYY-MM-DDTHH:mm:ss")}`;
};

const ExportToCsvSection = () => {
  const { exportToCsv } = useCsvExporter();
  return (
    <SidebarSection>
      <SidebarSectionTitle>
        <Trans i18nKey="export" defaults="Export" />
      </SidebarSectionTitle>
      <SidebarSectionDescription>
        <Trans
          i18nKey="exportCsvDescription"
          defaults="View your results in Excel."
        />
      </SidebarSectionDescription>
      <Button className="w-full" icon={DownloadIcon} onClick={exportToCsv}>
        <Trans i18nKey="exportToCsv" />
      </Button>
    </SidebarSection>
  );
};

const StatusSection = () => {
  const { poll, urlId } = usePoll();
  const updatePoll = useUpdatePollMutation();
  return (
    <SidebarSection>
      <SidebarSectionTitle>
        <Trans i18nKey="status" defaults="Status" />
      </SidebarSectionTitle>
      <SidebarSectionDescription>
        <Trans
          i18nKey="lockPollDescription"
          defaults="Prevent participants from adding or changing the results of this poll."
        />
      </SidebarSectionDescription>
      <div className="flex items-center space-x-4">
        <label htmlFor="lock-toggle">
          <Trans i18nKey="lock" defaults="Lock" />
        </label>
        <Switch
          id="lock-toggle"
          checked={poll.closed}
          onClick={() => {
            updatePoll.mutate({
              urlId,
              closed: !poll.closed,
            });
          }}
        />
      </div>
    </SidebarSection>
  );
};

const EditPollSection = () => {
  const { poll, getParticipantsWhoVotedForOption, urlId } = usePoll();
  const { t } = useTranslation();
  const modalContext = useModalContext();
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
    <SidebarSection>
      {changeOptionsModalContextHolder}
      {changePollDetailsModalContextHolder}
      <SidebarSectionTitle>
        <Trans i18nKey="manage" />
      </SidebarSectionTitle>
      <SidebarSectionDescription>
        <Trans
          i18nKey="editPollDescription"
          defaults="Make changes to your poll."
        />
      </SidebarSectionDescription>
      <div className="grid gap-2">
        <Button icon={PencilIcon} onClick={openChangePollDetailsModa}>
          <Trans i18nKey="editDetails" />
        </Button>
        <Button icon={TableIcon} onClick={openChangeOptionsModal}>
          <Trans i18nKey="editOptions" />
        </Button>
      </div>
    </SidebarSection>
  );
};

export const ManageSidebar = () => {
  return (
    <div className="w-80 shrink-0 bg-white">
      <div className="flex flex-col">
        <div className="min-h-0 grow divide-y overflow-auto">
          <EditPollSection />
          <ExportToCsvSection />
          <StatusSection />
        </div>
      </div>
    </div>
  );
};
