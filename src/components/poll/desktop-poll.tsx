import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useMeasure } from "react-use";
import smoothscroll from "smoothscroll-polyfill";

import { Button } from "../button";
import ArrowLeft from "../icons/arrow-left.svg";
import ArrowRight from "../icons/arrow-right.svg";
import { useParticipants } from "../participants-provider";
import { usePoll } from "../poll-context";
import TimeZonePicker from "../time-zone-picker";
import ParticipantRow from "./desktop-poll/participant-row";
import ParticipantRowForm from "./desktop-poll/participant-row-form";
import { PollContext } from "./desktop-poll/poll-context";
import PollHeader from "./desktop-poll/poll-header";
import { useAddParticipantMutation } from "./mutations";

if (typeof window !== "undefined") {
  smoothscroll.polyfill();
}

const MotionButton = motion(Button);

const minSidebarWidth = 200;

const Poll: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("app");

  const { poll, options, userAlreadyVoted, targetTimeZone, setTargetTimeZone } =
    usePoll();

  const { participants } = useParticipants();

  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const [editingParticipantId, setEditingParticipantId] =
    React.useState<string | null>(null);

  const actionColumnWidth = 140;
  const columnWidth = Math.min(
    130,
    Math.max(
      90,
      (width - minSidebarWidth - actionColumnWidth) / options.length,
    ),
  );

  const numberOfVisibleColumns = Math.min(
    options.length,
    Math.floor((width - (minSidebarWidth + actionColumnWidth)) / columnWidth),
  );

  const sidebarWidth =
    width - (numberOfVisibleColumns * columnWidth + actionColumnWidth);

  const availableSpace = Math.min(
    numberOfVisibleColumns * columnWidth,
    options.length * columnWidth,
  );

  const [activeOptionId, setActiveOptionId] =
    React.useState<string | null>(null);

  const [scrollPosition, setScrollPosition] = React.useState(0);

  const maxScrollPosition =
    columnWidth * options.length - columnWidth * numberOfVisibleColumns;

  const shouldShowNewParticipantForm = !userAlreadyVoted && !poll.closed;

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
        <div className="flex max-h-[calc(100vh-70px)] flex-col overflow-hidden bg-white">
          {poll.timeZone ? (
            <div className="flex h-14 items-center justify-end space-x-4 border-b bg-gray-50 px-4">
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
            <div className="flex border-b py-2">
              <div
                className="flex shrink-0 items-center py-2 pl-4 pr-2 font-medium"
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
                  />
                );
              })}
            </div>
          ) : null}
          {shouldShowNewParticipantForm ? (
            <ParticipantRowForm
              className="border-t bg-gray-50"
              onSubmit={async ({ name, votes }) => {
                const participant = await addParticipant.mutateAsync({
                  name,
                  votes,
                  pollId: poll.id,
                });
                setTimeout(() => {
                  participantListContainerRef.current
                    ?.querySelector(`[data-participantid=${participant.id}]`)
                    ?.scrollIntoView();
                }, 100);
              }}
            />
          ) : null}
        </div>
      </div>
    </PollContext.Provider>
  );
};

export default React.memo(Poll);
