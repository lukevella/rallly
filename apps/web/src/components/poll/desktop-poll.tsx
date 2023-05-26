import { ArrowLeftIcon, ArrowRightIcon, PlusSmIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import clsx from "clsx";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import { useMeasure } from "react-use";

import { useRole } from "@/contexts/role";

import { useNewParticipantModal } from "../new-participant-modal";
import { useParticipants } from "../participants-provider";
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

  const { poll, options, userAlreadyVoted } = usePoll();

  const { participants } = useParticipants();

  const [ref, { width }] = useMeasure<HTMLDivElement>();

  const [editingParticipantId, setEditingParticipantId] = React.useState<
    string | null
  >(null);

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

  const [activeOptionId, setActiveOptionId] = React.useState<string | null>(
    null,
  );

  const [scrollPosition, setScrollPosition] = React.useState(0);

  const maxScrollPosition =
    columnWidth * options.length - columnWidth * numberOfVisibleColumns;

  const [shouldShowNewParticipantForm, setShouldShowNewParticipantForm] =
    React.useState(!(poll.closed || userAlreadyVoted));

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
  const role = useRole();
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
        <div className="flex flex-col overflow-hidden">
          <div className="flex h-14 shrink-0 items-center justify-between rounded-t-md border-b bg-gradient-to-b from-gray-50 to-gray-100/50 p-3">
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
                  <div className="px-1 font-medium">
                    {t("participantCount", { count: participants.length })}
                  </div>
                  {role === "admin" || !poll.closed ? (
                    <Button
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingParticipantId(null);
                        setShouldShowNewParticipantForm(true);
                      }}
                    >
                      <PlusSmIcon className="h-5 w-5 shrink-0" />
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 font-medium">
                {t("optionCount", { count: options.length })}
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
                    className="text-xs"
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
          <div>
            <div className="flex py-3">
              <div
                className="flex shrink-0 items-end pl-4 pr-2 font-medium"
                style={{ width: sidebarWidth }}
              >
                <div className="font-semibold text-gray-800"></div>
              </div>
              <PollHeader />
            </div>
          </div>
          <div>
            <div>
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
              {participants.length > 0 ? (
                <div className="py-2">
                  {participants.map((participant, i) => {
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
                  })}
                </div>
              ) : null}
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
