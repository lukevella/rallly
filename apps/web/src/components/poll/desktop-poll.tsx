import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  Users2Icon,
} from "@rallly/icons";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Table } from "@rallly/ui/table";
import clsx from "clsx";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import { useMeasure, useScroll, useUpdateEffect } from "react-use";

import { TimesShownIn } from "@/components/clock";
import { usePermissions } from "@/contexts/permissions";
import { useRole } from "@/contexts/role";

import { useNewParticipantModal } from "../new-participant-modal";
import {
  useParticipants,
  useVisibleParticipants,
} from "../participants-provider";
import { usePoll } from "../poll-context";
import ParticipantRow from "./desktop-poll/participant-row";
import ParticipantRowForm from "./desktop-poll/participant-row-form";
import { PollContext } from "./desktop-poll/poll-context";
import PollHeader from "./desktop-poll/poll-header";
import {
  useAddParticipantMutation,
  useUpdateParticipantMutation,
} from "./mutations";

const minSidebarWidth = 200;

const Poll: React.FunctionComponent = () => {
  const { t } = useTranslation();

  const { poll, userAlreadyVoted } = usePoll();

  const { participants } = useParticipants();

  const [ref, { width }] = useMeasure<HTMLDivElement>();

  const [editingParticipantId, setEditingParticipantId] = React.useState<
    string | null
  >(null);

  const columnWidth = 75;

  const numberOfVisibleColumns = Math.min(
    poll.options.length,
    Math.floor((width - minSidebarWidth) / columnWidth),
  );

  const sidebarWidth = Math.min(
    width - numberOfVisibleColumns * columnWidth,
    275,
  );

  const availableSpace = Math.min(
    numberOfVisibleColumns * columnWidth,
    poll.options.length * columnWidth,
  );

  const [activeOptionId, setActiveOptionId] = React.useState<string | null>(
    null,
  );

  const [scrollPosition, setScrollPosition] = React.useState(0);

  const maxScrollPosition =
    columnWidth * poll.options.length - columnWidth * numberOfVisibleColumns;

  const { canAddNewParticipant } = usePermissions();

  const role = useRole();
  const [shouldShowNewParticipantForm, setShouldShowNewParticipantForm] =
    React.useState(
      canAddNewParticipant && !userAlreadyVoted && role === "participant",
    );

  const pollWidth = sidebarWidth + poll.options.length * columnWidth;
  const addParticipant = useAddParticipantMutation();

  useUpdateEffect(() => {
    if (!canAddNewParticipant) {
      setShouldShowNewParticipantForm(false);
    }
  }, [canAddNewParticipant]);

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

  const visibleParticipants = useVisibleParticipants();

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { x } = useScroll(scrollRef);

  const showScrollHint =
    scrollRef.current &&
    scrollRef.current.scrollWidth > scrollRef.current.clientWidth &&
    x + scrollRef.current.offsetWidth < scrollRef.current.scrollWidth;

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
        className={clsx(
          "relative min-w-full max-w-full duration-300",
          width === 0 ? "invisible" : "visible",
        )} // Don't add styles like border, margin, padding – that can mess up the sizing calculations
        style={{ width: pollWidth }}
        ref={ref}
      >
        <div className="flex flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between rounded-t-md border-b bg-gradient-to-b from-gray-50 to-gray-100/50 py-3 px-4">
            <div>
              {shouldShowNewParticipantForm || editingParticipantId ? (
                <div className="px-1">
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
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Users2Icon className="h-5 w-5 shrink-0" />
                  <div className="font-semibold">
                    {t("participants", { count: participants.length })} (
                    {participants.length})
                  </div>
                  {canAddNewParticipant ? (
                    <Button
                      className="ml-2"
                      size="sm"
                      data-testid="add-participant-button"
                      icon={PlusIcon}
                      onClick={() => {
                        setEditingParticipantId(null);
                        setShouldShowNewParticipantForm(true);
                      }}
                    />
                  ) : null}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="font-semibold">
                {t("optionCount", { count: poll.options.length })}
              </div>
              {maxScrollPosition > 0 ? (
                <div className="flex gap-2">
                  <Button
                    onClick={goToPreviousPage}
                    disabled={scrollPosition === 0}
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    disabled={scrollPosition === maxScrollPosition}
                    onClick={() => {
                      goToNextPage();
                    }}
                  >
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
          {poll.options[0].duration !== 0 ? (
            <div className="border-b bg-gray-50 p-3">
              <TimesShownIn />
            </div>
          ) : null}
          <div className="relative">
            <div
              className={cn(
                "pointer-events-none absolute right-0 z-30 h-full w-20 bg-gradient-to-r from-transparent to-gray-100 transition-opacity",
                showScrollHint ? "opacity-100" : " opacity-0",
              )}
            />
            <div
              ref={scrollRef}
              className="scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-100 relative z-10 max-h-[calc(100vh-100px)] flex-grow overflow-auto pb-2 pr-3"
            >
              <table>
                <thead>
                  <tr>
                    <th
                      className="sticky left-0 top-0 z-30 bg-white pl-4 pr-4"
                      style={{ minWidth: sidebarWidth }}
                    />
                    <PollHeader />
                  </tr>
                </thead>
                <tbody>
                  {shouldShowNewParticipantForm && !editingParticipantId ? (
                    <ParticipantRowForm
                      className="mb-2 shrink-0"
                      onSubmit={async ({ votes }) => {
                        showNewParticipantModal({
                          votes,
                          onSubmit: () => {
                            setShouldShowNewParticipantForm(false);
                          },
                        });
                      }}
                    />
                  ) : null}
                  {visibleParticipants.length > 0
                    ? visibleParticipants.map((participant, i) => {
                        return (
                          <ParticipantRow
                            key={i}
                            participant={participant}
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
                      })
                    : null}
                </tbody>
              </table>
            </div>
          </div>
          {shouldShowNewParticipantForm || editingParticipantId ? (
            <div className="flex shrink-0 items-center border-t bg-gray-50">
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
                  type="submit"
                  variant="primary"
                  loading={
                    addParticipant.isLoading || updateParticipant.isLoading
                  }
                >
                  {shouldShowNewParticipantForm ? t("continue") : t("save")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </PollContext.Provider>
  );
};

export default React.memo(Poll);
