import { AnimatePresence, motion } from "framer-motion";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import { useMeasure } from "react-use";

import ArrowLeft from "@/components/icons/arrow-left.svg";
import ArrowRight from "@/components/icons/arrow-right.svg";
import Check from "@/components/icons/check.svg";
import Plus from "@/components/icons/plus-sm.svg";

import { Button } from "../button";
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

const MotionButton = motion(Button);

const minSidebarWidth = 200;

const Poll: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("app");

  const { poll, options, targetTimeZone, setTargetTimeZone, userAlreadyVoted } =
    usePoll();

  const { participants } = useParticipants();

  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const [editingParticipantId, setEditingParticipantId] =
    React.useState<string | null>(null);

  const actionColumnWidth = 100;
  const columnWidth = 90;

  const numberOfVisibleColumns = Math.min(
    options.length,
    Math.floor((width - (minSidebarWidth + actionColumnWidth)) / columnWidth),
  );

  const sidebarWidth = Math.min(
    width - (numberOfVisibleColumns * columnWidth + actionColumnWidth),
    300,
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

  const pollWidth =
    sidebarWidth + options.length * columnWidth + actionColumnWidth;

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

  const participantListContainerRef = React.useRef<HTMLDivElement>(null);
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
        actionColumnWidth,
        maxScrollPosition,
      }}
    >
      <div
        className="relative min-w-full max-w-full" // Don't add styles like border, margin, padding – that can mess up the sizing calculations
        style={{ width: pollWidth }}
        ref={ref}
      >
        <div className="flex flex-col overflow-hidden">
          {poll.timeZone ? (
            <div className="flex h-14 shrink-0 items-center justify-end space-x-4 border-b bg-gray-50 px-4">
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
              >
                <div className="flex h-full grow items-end">
                  {t("participantCount", { count: participants.length })}
                </div>
                <AnimatePresence initial={false}>
                  {scrollPosition > 0 ? (
                    <MotionButton
                      transition={{ duration: 0.1 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      rounded={true}
                      onClick={goToPreviousPage}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </MotionButton>
                  ) : null}
                </AnimatePresence>
              </div>
              <PollHeader />
              <div
                className="flex items-center py-3 px-2"
                style={{ width: actionColumnWidth }}
              >
                {maxScrollPosition > 0 ? (
                  <AnimatePresence initial={false}>
                    {scrollPosition < maxScrollPosition ? (
                      <MotionButton
                        transition={{ duration: 0.1 }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-xs"
                        rounded={true}
                        onClick={() => {
                          goToNextPage();
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </MotionButton>
                    ) : null}
                  </AnimatePresence>
                ) : null}
              </div>
            </div>
          </div>
          {participants.length > 0 ? (
            <div
              className="min-h-0 overflow-y-auto py-2"
              ref={participantListContainerRef}
            >
              {participants.map((participant, i) => {
                return (
                  <ParticipantRow
                    key={i}
                    participant={participant}
                    editMode={editingParticipantId === participant.id}
                    onChangeEditMode={(isEditing) => {
                      setEditingParticipantId(
                        isEditing ? participant.id : null,
                      );
                    }}
                    onSubmit={async ({ name, votes }) => {
                      await updateParticipant.mutateAsync({
                        participantId: participant.id,
                        pollId: poll.id,
                        votes,
                        name,
                      });
                    }}
                  />
                );
              })}
            </div>
          ) : null}
          {shouldShowNewParticipantForm &&
          !poll.closed &&
          !editingParticipantId ? (
            <ParticipantRowForm
              className="shrink-0 border-t bg-gray-50"
              onSubmit={async ({ name, votes }) => {
                await addParticipant.mutateAsync({
                  name,
                  votes,
                  pollId: poll.id,
                });
                setShouldShowNewParticipantForm(false);
              }}
            />
          ) : null}
          {!poll.closed ? (
            <div className="flex h-14 shrink-0 items-center border-t bg-gray-50 px-3">
              {shouldShowNewParticipantForm || editingParticipantId ? (
                <div className="flex items-center space-x-3">
                  <Button
                    key="submit"
                    form="participant-row-form"
                    htmlType="submit"
                    type="primary"
                    icon={<Check />}
                    loading={
                      addParticipant.isLoading || updateParticipant.isLoading
                    }
                  >
                    {t("save")}
                  </Button>
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
                  <div className="text-sm">
                    <Trans
                      t={t}
                      i18nKey="saveInstruction"
                      values={{
                        save: t("save"),
                      }}
                      components={{ b: <strong /> }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex w-full items-center space-x-3">
                  <Button
                    key="add-participant"
                    onClick={() => {
                      setShouldShowNewParticipantForm(true);
                    }}
                    icon={<Plus />}
                  >
                    {t("addParticipant")}
                  </Button>
                  {userAlreadyVoted ? (
                    <div className="flex items-center text-sm text-gray-400">
                      <Check className="mr-1 h-5" />
                      <div>{t("alreadyVoted")}</div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </PollContext.Provider>
  );
};

export default React.memo(Poll);
