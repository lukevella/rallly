import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useMeasure } from "react-use";
import smoothscroll from "smoothscroll-polyfill";

import Button from "../button";
import ArrowLeft from "../icons/arrow-left.svg";
import ArrowRight from "../icons/arrow-right.svg";
import PlusCircle from "../icons/plus-circle.svg";
import { usePoll } from "../poll-context";
import TimeZonePicker from "../time-zone-picker";
import ParticipantRow from "./desktop-poll/participant-row";
import ParticipantRowForm from "./desktop-poll/participant-row-form";
import { PollContext } from "./desktop-poll/poll-context";
import PollHeader from "./desktop-poll/poll-header";
import { useAddParticipantMutation } from "./mutations";
import { PollProps } from "./types";

if (typeof window !== "undefined") {
  smoothscroll.polyfill();
}

const MotionButton = motion(Button);

const minSidebarWidth = 180;

const Poll: React.VoidFunctionComponent<PollProps> = ({ pollId }) => {
  const { t } = useTranslation("app");

  const { poll, targetTimeZone, setTargetTimeZone, options } = usePoll();

  const { timeZone, participants, role } = poll;

  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const [editingParticipantId, setEditingParticipantId] =
    React.useState<string | null>(null);

  const actionColumnWidth = 160;
  const columnWidth = Math.min(
    100,
    Math.max(
      95,
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

  const numberOfInvisibleColumns = options.length - numberOfVisibleColumns;

  const [didUsePagination, setDidUsePagination] = React.useState(false);

  const [shouldShowNewParticipantForm, setShouldShowNewParticipantForm] =
    React.useState(participants.length === 0);

  const pollWidth =
    sidebarWidth + options.length * columnWidth + actionColumnWidth;

  const { mutate: addParticipant } = useAddParticipantMutation(pollId);

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
      }}
    >
      <div
        className="relative min-w-full max-w-full" // Don't add styles like border, margin, padding – that can mess up the sizing calculations
        style={{ width: `min(${pollWidth}px, calc(100vw - 3rem))` }}
        ref={ref}
      >
        <div className=" border-t border-b bg-white shadow-sm md:rounded-lg md:border">
          <div className="sticky top-0 z-10 rounded-t-lg border-b border-gray-200 bg-white/80 shadow-sm shadow-slate-50 backdrop-blur-md">
            <div className="flex h-14 items-center justify-end space-x-4 rounded-t-lg border-b bg-gray-50 px-4">
              {timeZone ? (
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
              ) : null}
              <div className="flex shrink-0">
                {!shouldShowNewParticipantForm && !poll.closed ? (
                  <Button
                    type="primary"
                    icon={<PlusCircle />}
                    onClick={() => {
                      setShouldShowNewParticipantForm(true);
                    }}
                  >
                    New Participant
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="flex">
              <div
                className="flex shrink-0 items-center py-4 pl-4 pr-2 font-medium"
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
                          setDidUsePagination(true);
                          goToNextPage();
                        }}
                      >
                        {didUsePagination ? (
                          <ArrowRight className="h-4 w-4" />
                        ) : (
                          `+${numberOfInvisibleColumns} more…`
                        )}
                      </MotionButton>
                    ) : null}
                  </AnimatePresence>
                ) : null}
              </div>
            </div>
            {shouldShowNewParticipantForm ? (
              <ParticipantRowForm
                className="border-t bg-slate-100 bg-opacity-0"
                onSubmit={(data) => {
                  return new Promise((resolve, reject) => {
                    addParticipant(data, {
                      onSuccess: () => {
                        setShouldShowNewParticipantForm(false);
                        resolve();
                      },
                      onError: reject,
                    });
                  });
                }}
                options={poll.options}
                onCancel={() => {
                  setShouldShowNewParticipantForm(false);
                }}
              />
            ) : null}
          </div>
          <div className="min-h-0 overflow-y-auto">
            {participants.map((participant, i) => {
              return (
                <ParticipantRow
                  urlId={pollId}
                  key={i}
                  participant={participant}
                  options={poll.options}
                  canDelete={role === "admin"}
                  editMode={editingParticipantId === participant.id}
                  onChangeEditMode={(isEditing) => {
                    setEditingParticipantId(isEditing ? participant.id : null);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </PollContext.Provider>
  );
};

export default React.memo(Poll);
