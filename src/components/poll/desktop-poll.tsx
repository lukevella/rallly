import { AnimatePresence, motion } from "framer-motion";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import { useMeasure } from "react-use";

import ArrowLeft from "@/components/icons/arrow-left.svg";
import ArrowRight from "@/components/icons/arrow-right.svg";

import { Button } from "../button";
import { useNewParticipantModal } from "../new-participant-modal";
import { useParticipants } from "../participants-provider";
import { usePoll } from "../poll-context";
import TimeZonePicker from "../time-zone-picker";
import ParticipantRow from "./desktop-poll/participant-row";
import ParticipantRowForm from "./desktop-poll/participant-row-form";
import { PollContext } from "./desktop-poll/poll-context";
import PollHeader from "./desktop-poll/poll-header";
import {
  useAddParticipantMutation,
  useUpdateParticipantMutation,
} from "./mutations";

const minSidebarWidth = 200;

const Poll: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("app");

  const { poll, options, targetTimeZone, setTargetTimeZone, userAlreadyVoted } =
    usePoll();

  const { participants } = useParticipants();

  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const [editingParticipantId, setEditingParticipantId] =
    React.useState<string | null>(null);

  const columnWidth = 80;

  const numberOfVisibleColumns = Math.min(
    options.length,
    Math.floor((width - minSidebarWidth) / columnWidth),
  );

  const sidebarWidth = Math.min(
    width - numberOfVisibleColumns * columnWidth,
    275,
  );

  const availableSpace = Math.min(
    numberOfVisibleColumns * columnWidth,
    options.length * columnWidth,
  );

  const [activeOptionId, setActiveOptionId] =
    React.useState<string | null>(null);

  const [scrollPosition, setScrollPosition] = React.useState(0);

  const maxScrollPosition =
    columnWidth * options.length - columnWidth * numberOfVisibleColumns;

  const [shouldShowNewParticipantForm, setShouldShowNewParticipantForm] =
    React.useState(!poll.closed && !userAlreadyVoted);

  const pollWidth = sidebarWidth + options.length * columnWidth;

  const addParticipant = useAddParticipantMutation();

  const goToNextPage = () => {
    setScrollPosition(
      Math.min(
        maxScrollPosition,
        scrollPosition + numberOfVisibleColumns * columnWidth,
      ),
    );
  };

  const goToPreviousPage = () => {
    setScrollPosition(
      Math.max(0, scrollPosition - numberOfVisibleColumns * columnWidth),
    );
  };

  const updateParticipant = useUpdateParticipantMutation();

  const showNewParticipantModal = useNewParticipantModal();
  return (
    <PollContext.Provider
      value={{
        activeOptionId,
        setActiveOptionId,
        scrollPosition,
        setScrollPosition,
        columnWidth,
        sidebarWidth,
        goToNextPage,
        goToPreviousPage,
        numberOfColumns: numberOfVisibleColumns,
        availableSpace,
        maxScrollPosition,
      }}
    >
      <div
        className="relative min-w-full max-w-full" // Don't add styles like border, margin, padding – that can mess up the sizing calculations
        style={{ width: pollWidth }}
        ref={ref}
      >
        <div className="flex flex-col overflow-hidden">
          <div className="flex h-14 shrink-0 items-center justify-between border-b bg-gradient-to-b from-gray-50 to-gray-100/50 p-3">
            <div className="p-1">
              {shouldShowNewParticipantForm || editingParticipantId ? (
                <Trans
                  t={t}
                  i18nKey="saveInstruction"
                  values={{
                    action: shouldShowNewParticipantForm
                      ? t("continue")
                      : t("save"),
                  }}
                  components={{ b: <strong /> }}
                />
              ) : (
                <div className="flex gap-2">
                  <div className="font-semibold text-slate-800">
                    {t("participantCount", { count: participants.length })}
                  </div>
                  {poll.closed ? null : (
                    <button
                      className="rounded hover:text-primary-500"
                      onClick={() => {
                        setEditingParticipantId(null);
                        setShouldShowNewParticipantForm(true);
                      }}
                    >
                      + {t("new")}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1">
                {t("optionCount", { count: options.length })}
              </div>
              {maxScrollPosition > 0 ? (
                <div className="flex gap-2">
                  <Button
                    onClick={goToPreviousPage}
                    disabled={scrollPosition === 0}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    className="text-xs"
                    disabled={scrollPosition === maxScrollPosition}
                    onClick={() => {
                      goToNextPage();
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
          {poll.timeZone ? (
            <div className="flex h-14 shrink-0 items-center justify-end space-x-4 border-b bg-gradient-to-b from-gray-50 to-gray-100/50 px-4">
              <div className="flex grow items-center">
                <div className="mr-2 text-sm font-medium text-slate-500">
                  {t("timeZone")}
                </div>
                <TimeZonePicker
                  value={targetTimeZone}
                  onChange={setTargetTimeZone}
                  className="grow"
                />
              </div>
            </div>
          ) : null}
          <div>
            <div className="flex py-3">
              <div
                className="flex shrink-0 items-center pl-4 pr-2 font-medium"
                style={{ width: sidebarWidth }}
              ></div>
              <PollHeader />
            </div>
          </div>
          <div className="pb-2">
            <AnimatePresence initial={false}>
              {shouldShowNewParticipantForm &&
              !poll.closed &&
              !editingParticipantId ? (
                <motion.div
                  variants={{
                    hidden: { height: 0, y: -50, opacity: 0 },
                    visible: { height: "auto", y: 0, opacity: 1 },
                    exit: { height: 0, opacity: 0, y: -25 },
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  <ParticipantRowForm
                    className="shrink-0"
                    onSubmit={async ({ votes }) => {
                      showNewParticipantModal({
                        votes,
                        onSubmit: () => {
                          setShouldShowNewParticipantForm(false);
                        },
                      });
                    }}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
            {participants.map((participant, i) => {
              return (
                <ParticipantRow
                  key={i}
                  className={
                    editingParticipantId &&
                    editingParticipantId !== participant.id
                      ? "opacity-50"
                      : ""
                  }
                  participant={participant}
                  disableEditing={!!editingParticipantId}
                  editMode={editingParticipantId === participant.id}
                  onChangeEditMode={(isEditing) => {
                    if (isEditing) {
                      setShouldShowNewParticipantForm(false);
                      setEditingParticipantId(participant.id);
                    }
                  }}
                  onSubmit={async ({ votes }) => {
                    await updateParticipant.mutateAsync({
                      participantId: participant.id,
                      pollId: poll.id,
                      votes,
                    });
                    setEditingParticipantId(null);
                  }}
                />
              );
            })}
          </div>
          <AnimatePresence initial={false}>
            {shouldShowNewParticipantForm || editingParticipantId ? (
              <motion.div
                variants={{
                  hidden: { height: 0, y: 30, opacity: 0 },
                  visible: { height: "auto", y: 0, opacity: 1 },
                }}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex shrink-0 items-center border-t bg-gray-50"
              >
                <div className="flex w-full items-center justify-between gap-3 p-3">
                  <Button
                    onClick={() => {
                      if (editingParticipantId) {
                        setEditingParticipantId(null);
                      } else {
                        setShouldShowNewParticipantForm(false);
                      }
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    key="submit"
                    form="participant-row-form"
                    htmlType="submit"
                    type="primary"
                    loading={
                      addParticipant.isLoading || updateParticipant.isLoading
                    }
                  >
                    {shouldShowNewParticipantForm ? t("continue") : t("save")}
                  </Button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </PollContext.Provider>
  );
};

export default React.memo(Poll);
