import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  Users2Icon,
} from "@rallly/icons";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
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
import PollHeader from "./desktop-poll/poll-header";
import {
  useAddParticipantMutation,
  useUpdateParticipantMutation,
} from "./mutations";

const Poll: React.FunctionComponent = () => {
  const { t } = useTranslation();

  const { poll, userAlreadyVoted } = usePoll();

  const { participants } = useParticipants();

  const [editingParticipantId, setEditingParticipantId] = React.useState<
    string | null
  >(null);

  const { canAddNewParticipant } = usePermissions();

  const role = useRole();
  const [shouldShowNewParticipantForm, setShouldShowNewParticipantForm] =
    React.useState(
      canAddNewParticipant && !userAlreadyVoted && role === "participant",
    );

  const addParticipant = useAddParticipantMutation();

  useUpdateEffect(() => {
    if (!canAddNewParticipant) {
      setShouldShowNewParticipantForm(false);
    }
  }, [canAddNewParticipant]);

  const goToNextPage = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += scrollRef.current.clientWidth;
    }
  };

  const goToPreviousPage = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft -= scrollRef.current.offsetWidth;
    }
  };

  const updateParticipant = useUpdateParticipantMutation();

  const showNewParticipantModal = useNewParticipantModal();

  const visibleParticipants = useVisibleParticipants();

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { x } = useScroll(scrollRef);
  const isOverflowing =
    scrollRef.current &&
    scrollRef.current.scrollWidth > scrollRef.current.clientWidth;

  const showScrollHint =
    scrollRef.current &&
    isOverflowing &&
    x + scrollRef.current.offsetWidth < scrollRef.current.scrollWidth;

  return (
    <div>
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
            {isOverflowing ? (
              <div className="flex gap-2">
                <Button onClick={goToPreviousPage}>
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
                <Button
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
              "pointer-events-none absolute right-0 z-30 h-full w-20  bg-gradient-to-r from-transparent to-gray-50 transition-transform",
              showScrollHint ? "translate-x-0" : "translate-x-20",
            )}
          />
          <div
            ref={scrollRef}
            className="scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-100 relative z-10 max-h-[calc(100vh-100px)] flex-grow overflow-auto scroll-smooth pb-2 pr-3"
          >
            <table className="table-fixed">
              <thead>
                <tr>
                  <th className="sticky left-0 z-30 bg-white pl-4 pr-4" />
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
  );
};

export default React.memo(Poll);
