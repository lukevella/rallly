import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@rallly/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExpandIcon,
  PlusIcon,
  ShareIcon,
  ShrinkIcon,
} from "lucide-react";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import { RemoveScroll } from "react-remove-scroll";
import { useMeasure, useScroll } from "react-use";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { TimesShownIn } from "@/components/clock";
import { CopyInviteLinkButton, InviteDialog } from "@/components/invite-dialog";
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
    <Card>
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
              "shadow-huge flex max-h-full flex-col overflow-hidden rounded-md",
            )}
          >
            <CardHeader className="flex items-center justify-between gap-4">
              <div className="flex h-9 items-center">
                {mode !== "view" ? (
                  <p className="text-sm">
                    <Trans
                      t={t}
                      i18nKey="saveInstruction"
                      values={{
                        action: mode === "new" ? t("continue") : t("save"),
                      }}
                      components={{ b: <strong /> }}
                    />
                  </p>
                ) : (
                  <div className="flex items-center gap-2">
                    <CardTitle>
                      {t("participants", { count: participants.length })}
                    </CardTitle>
                    <Badge>{participants.length}</Badge>
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
                          <ArrowLeftIcon className="size-4" />
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
                          <ArrowRightIcon className="size-4" />
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
            </CardHeader>
            {poll.options[0]?.duration !== 0 && poll.timeZone ? (
              <div className="border-b bg-gray-50 p-3">
                <TimesShownIn />
              </div>
            ) : null}
            <div className="relative flex min-h-0 flex-col">
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute bottom-0 left-[240px] top-0 z-30 w-4 border-l bg-gradient-to-r from-gray-800/5 via-transparent to-transparent transition-opacity",
                  x > 0 ? "opacity-100" : "opacity-0",
                )}
              />
              <RemoveScroll
                enabled={expanded}
                ref={scrollRef}
                className={cn(
                  "scrollbar-thin hover:scrollbar-thumb-gray-400 scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative z-10 flex-grow overflow-auto scroll-smooth",
                )}
              >
                <table className="w-full table-auto border-separate border-spacing-0 ">
                  <thead>
                    <PollHeader />
                  </thead>
                  <tbody>
                    {mode === "new" ? <ParticipantRowForm /> : null}
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
                              className={
                                i === visibleParticipants.length - 1
                                  ? "last-row"
                                  : ""
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
              <CardFooter>
                <div className="flex w-full items-center justify-between gap-3">
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
              </CardFooter>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DesktopPoll;
