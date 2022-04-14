import Button from "@/components/button";
import Cog from "@/components/icons/cog.svg";
import LockClosed from "@/components/icons/lock-closed.svg";
import LockOpen from "@/components/icons/lock-open.svg";
import Pencil from "@/components/icons/pencil-alt.svg";
import Save from "@/components/icons/save.svg";
import Table from "@/components/icons/table.svg";
import { Placement } from "@popperjs/core";
import { format } from "date-fns";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { decodeDateOption, encodeDateOption } from "utils/date-time-utils";
import Dropdown, { DropdownItem } from "../dropdown";
import { PollDetailsForm } from "../forms";
import { useModal } from "../modal";
import { usePoll } from "../use-poll";
import { useUpdatePollMutation } from "./mutations";

const PollOptionsForm = React.lazy(() => import("../forms/poll-options-form"));

const ManagePoll: React.VoidFunctionComponent<{
  targetTimeZone: string;
  placement?: Placement;
}> = ({ targetTimeZone, placement }) => {
  const { t } = useTranslation("app");
  const poll = usePoll();

  const { mutate: updatePollMutation, isLoading: isUpdating } =
    useUpdatePollMutation();
  const [
    changeOptionsModalContextHolder,
    openChangeOptionsModal,
    closeChangeOptionsModal,
  ] = useModal({
    overlayClosable: true,
    okText: "Save",
    okButtonProps: {
      form: "pollOptions",
      htmlType: "submit",
      loading: isUpdating,
    },
    cancelText: "Cancel",
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
                    date:
                      start.indexOf("T") === -1
                        ? start
                        : // legacy polls
                          new Date(start).toISOString().substring(0, 10),
                  };
            }),
            timeZone: poll.timeZone ?? "",
          }}
          onSubmit={(data) => {
            const encodedOptions = data.options.map(encodeDateOption);
            const optionsToDelete = poll.options
              .filter((option) => {
                return !encodedOptions.includes(option.value);
              })
              .map((option) => option.id);

            const optionsToAdd = encodedOptions.filter(
              (encodedOption) =>
                !poll.options.find((o) => o.value === encodedOption),
            );
            updatePollMutation(
              {
                timeZone: data.timeZone,
                optionsToDelete,
                optionsToAdd,
              },
              {
                onSuccess: () => closeChangeOptionsModal(),
              },
            );
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
    overlayClosable: true,
    okText: "Save changes",
    okButtonProps: {
      form: "updateDetails",
      loading: isUpdating,
      htmlType: "submit",
    },
    cancelText: "Cancel",
    content: (
      <PollDetailsForm
        name="updateDetails"
        defaultValues={{
          title: poll.title,
          location: poll.location ?? "",
          description: poll.description ?? "",
        }}
        className="p-4"
        onSubmit={(data) => {
          //submit
          updatePollMutation(data, { onSuccess: closePollDetailsModal });
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
        trigger={<Button icon={<Cog />}>Manage</Button>}
      >
        <DropdownItem
          icon={Pencil}
          label="Edit details"
          onClick={openChangePollDetailsModa}
        />
        {!poll.legacy ? (
          <DropdownItem
            icon={Table}
            label="Edit options"
            onClick={openChangeOptionsModal}
          />
        ) : null}
        <DropdownItem
          icon={Save}
          label="Export to CSV"
          onClick={() => {
            const header = [
              t("participantCount", {
                count: poll.participants.length,
              }),
              ...poll.options.map((option) => {
                const decodedOption = decodeDateOption(
                  option.value,
                  poll.timeZone,
                  targetTimeZone,
                );
                const day = `${decodedOption.dow} ${decodedOption.day} ${decodedOption.month}`;
                return decodedOption.type === "date"
                  ? day
                  : `${day} ${decodedOption.startTime} - ${decodedOption.endTime}`;
              }),
            ].join(",");
            const rows = poll.participants.map((participant) => {
              return [
                participant.name,
                ...poll.options.map((option) => {
                  if (
                    participant.votes.some((vote) => {
                      return vote.optionId === option.id;
                    })
                  ) {
                    return "Yes";
                  }
                  return "No";
                }),
              ].join(",");
            });
            const csv = `data:text/csv;charset=utf-8,${[header, ...rows].join(
              "\r\n",
            )}`;

            const encodedCsv = encodeURI(csv);
            var link = document.createElement("a");
            link.setAttribute("href", encodedCsv);
            link.setAttribute(
              "download",
              `${poll.title.replace(/\s/g, "_")}-${format(
                Date.now(),
                "yyyyMMddhhmm",
              )}`,
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        />
        {poll.closed ? (
          <DropdownItem
            icon={LockOpen}
            label="Unlock poll"
            onClick={() => updatePollMutation({ closed: false })}
          />
        ) : (
          <DropdownItem
            icon={LockClosed}
            label="Lock poll"
            onClick={() => updatePollMutation({ closed: true })}
          />
        )}
      </Dropdown>
    </div>
  );
};

export default ManagePoll;
