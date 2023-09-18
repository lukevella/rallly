import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExpandIcon,
  PlusIcon,
  ShrinkIcon,
  Users2Icon,
} from "@rallly/icons";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import { RemoveScroll } from "react-remove-scroll";
import { useMeasure, useScroll } from "react-use";

import { TimesShownIn } from "@/components/clock";
import { useVotingForm } from "@/components/poll/voting-form";
import { usePermissions } from "@/contexts/permissions";

import {
  useParticipants,
  useVisibleParticipants,
} from "../participants-provider";
import { usePoll } from "../poll-context";
import ParticipantRow from "./desktop-poll/participant-row";
import ParticipantRowForm from "./desktop-poll/participant-row-form";
import PollHeader from "./desktop-poll/poll-header";

const useIsOverflowing = <E extends Element | null>(
  ref: React.RefObject<E>,
) => {
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  React.useEffect(() => {
    const checkOverflow = () => {
      if (ref.current) {
        const element = ref.current;
        const overflowX = element.scrollWidth > element.clientWidth;
        const overflowY = element.scrollHeight > element.clientHeight;

        setIsOverflowing(overflowX || overflowY);
      }
    };

    if (ref.current) {
      const resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(ref.current);

      // Initial check
      checkOverflow();

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [ref]);

  return isOverflowing;
};

const DesktopPoll: React.FunctionComponent = () => {
  const { t } = useTranslation();

  const { poll } = usePoll();

  const { participants } = useParticipants();

  const votingForm = useVotingForm();

  const mode = votingForm.watch("mode");

  const [measureRef, { height }] = useMeasure<HTMLDivElement>();

  const { canAddNewParticipant } = usePermissions();

  const goToNextPage = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += 240;
    }
  };

  const [expanded, setExpanded] = React.useState(false);

  const expand = () => {
    setExpanded(true);
  };

  const collapse = () => {
    // enable scrolling on body
    document.body.style.overflow = "";
    setExpanded(false);
  };

  const goToPreviousPage = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft -= 240;
    }
  };

  const visibleParticipants = useVisibleParticipants();

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const isOverflowing = useIsOverflowing(scrollRef);

  const { x } = useScroll(scrollRef);

  return (
    <div ref={measureRef} style={{ height: expanded ? height : undefined }}>
      <div
        className={cn(
          expanded
            ? "fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-gray-900/25 p-8"
            : "",
        )}
      >
        <div
          className={cn(
            "shadow-huge flex max-h-full flex-col overflow-hidden rounded-md bg-white",
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between rounded-t-md border-b bg-gradient-to-b from-gray-50 to-gray-100/50 px-4 py-3">
            <div>
              {mode !== "view" ? (
                <div>
                  <Trans
                    t={t}
                    i18nKey="saveInstruction"
                    values={{
                      action: mode === "new" ? t("continue") : t("save"),
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
                        votingForm.newParticipant();
                      }}
                    />
                  ) : null}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium">
                {t("optionCount", { count: poll.options.length })}
              </div>
              {isOverflowing || expanded ? (
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button disabled={x === 0} onClick={goToPreviousPage}>
                        <ArrowLeftIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <Trans i18nKey="scrollLeft" defaults="Scroll Left" />
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={Boolean(
                          scrollRef.current &&
                            x + scrollRef.current.offsetWidth >=
                              scrollRef.current.scrollWidth,
                        )}
                        onClick={() => {
                          goToNextPage();
                        }}
                      >
                        <ArrowRightIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <Trans i18nKey="scrollRight" defaults="Scroll Right" />
                    </TooltipContent>
                  </Tooltip>
                  {expanded ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          icon={ShrinkIcon}
                          onClick={() => {
                            collapse();
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <Trans i18nKey="shrink" defaults="Shrink" />
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          icon={ExpandIcon}
                          onClick={() => {
                            expand();
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <Trans i18nKey="expand" defaults="Expand" />
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          {poll.options[0].duration !== 0 ? (
            <div className="border-b bg-gray-50 p-3">
              <TimesShownIn />
            </div>
          ) : null}
          <div className="relative flex min-h-0 flex-col">
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute bottom-2 left-[240px] top-0 z-30 w-4 border-l bg-gradient-to-r from-gray-800/5 via-transparent to-transparent transition-opacity",
                x > 0 ? "opacity-100" : "opacity-0",
              )}
            />
            <RemoveScroll
              enabled={expanded}
              ref={scrollRef}
              className={cn(
                "scrollbar-thin hover:scrollbar-thumb-gray-400 scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative z-10 flex-grow overflow-auto scroll-smooth pb-3 pr-3",
                expanded ? "" : "max-h-[calc(75vh)]",
              )}
            >
              <table className="w-full table-auto border-separate border-spacing-0 ">
                <thead>
                  <PollHeader />
                </thead>
                <tbody>
                  {mode === "new" ? (
                    <>
                      <ParticipantRowForm />
                      <tr aria-hidden="true">
                        <td
                          colSpan={poll.options.length + 1}
                          className="py-2"
                        />
                      </tr>
                    </>
                  ) : null}
                  {visibleParticipants.length > 0
                    ? visibleParticipants.map((participant, i) => {
                        return (
                          <ParticipantRow
                            key={i}
                            participant={participant}
                            editMode={
                              votingForm.watch("mode") === "edit" &&
                              votingForm.watch("participantId") ===
                                participant.id
                            }
                            onChangeEditMode={(isEditing) => {
                              if (isEditing) {
                                votingForm.setEditingParticipantId(
                                  participant.id,
                                );
                              }
                            }}
                          />
                        );
                      })
                    : null}
                </tbody>
              </table>
            </RemoveScroll>
          </div>
          {mode !== "view" ? (
            <div className="flex shrink-0 items-center border-t bg-gray-50">
              <div className="flex w-full items-center justify-between gap-3 p-3">
                <Button
                  onClick={() => {
                    votingForm.cancel();
                  }}
                >
                  {t("cancel")}
                </Button>
                {mode === "new" ? (
                  <Button
                    form="voting-form"
                    type="submit"
                    variant="primary"
                    loading={votingForm.formState.isSubmitting}
                  >
                    {t("continue")}
                  </Button>
                ) : (
                  <Button
                    form="voting-form"
                    type="submit"
                    variant="primary"
                    loading={votingForm.formState.isSubmitting}
                  >
                    {t("save")}
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DesktopPoll;
