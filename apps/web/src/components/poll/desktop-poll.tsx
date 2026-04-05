import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Card, CardHeader, CardTitle } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExpandIcon,
  PlusIcon,
  ShrinkIcon,
  Users2Icon,
} from "lucide-react";
import * as React from "react";
import { useMeasure, useScroll } from "react-use";
import useClickAway from "react-use/lib/useClickAway";

import { TimesShownIn } from "@/components/clock";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { useVotingForm } from "@/components/poll/voting-form";
import { ScrollContainer } from "@/components/scroll-container";
import { usePermissions } from "@/contexts/permissions";
import { usePoll } from "@/contexts/poll";
import { Trans, useTranslation } from "@/i18n/client";
import {
  useParticipants,
  useVisibleParticipants,
} from "../participants-provider";
import ParticipantRow from "./desktop-poll/participant-row";
import ParticipantRowForm from "./desktop-poll/participant-row-form";
import PollHeader from "./desktop-poll/poll-header";

function EscapeListener({ onEscape }: { onEscape: () => void }) {
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onEscape]);

  return null;
}

function TableControls({
  optionCount,
  showTimeZone,
  showScrollControls,
  canScrollPrev,
  canScrollNext,
  showScrollIndicator,
  expanded,
  onExpand,
  onCollapse,
  onGoToPreviousPage,
  onGoToNextPage,
}: {
  optionCount: number;
  showTimeZone: boolean;
  showScrollControls: boolean;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  showScrollIndicator: boolean;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onGoToPreviousPage: () => void;
  onGoToNextPage: () => void;
}) {
  return (
    <div className="flex items-center gap-4">
      {showTimeZone ? (
        <>
          <TimesShownIn />
          <span className="h-4 w-px bg-border" />
        </>
      ) : null}
      <div className="text-muted-foreground text-sm">
        <Trans i18nKey="optionCount" values={{ count: optionCount }} />
      </div>
      <div className="flex gap-x-1">
        {showScrollControls ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!canScrollPrev}
                  onClick={onGoToPreviousPage}
                >
                  <Icon>
                    <ArrowLeftIcon />
                  </Icon>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <Trans i18nKey="scrollLeft" defaults="Scroll Left" />
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="relative"
                  variant="ghost"
                  size="icon"
                  disabled={!canScrollNext}
                  onClick={onGoToNextPage}
                >
                  <Icon>
                    <ArrowRightIcon />
                  </Icon>
                  {showScrollIndicator ? (
                    <span className="absolute -top-0.5 -right-0.5 flex size-2">
                      <span className="absolute top-0 right-0 inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
                    </span>
                  ) : null}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <Trans i18nKey="scrollRight" defaults="Scroll Right" />
              </TooltipContent>
            </Tooltip>
            {expanded ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onCollapse}>
                    <Icon>
                      <ShrinkIcon />
                    </Icon>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <Trans i18nKey="shrink" defaults="Shrink" />
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onExpand}>
                    <Icon>
                      <ExpandIcon />
                    </Icon>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <Trans i18nKey="expand" defaults="Expand" />
                </TooltipContent>
              </Tooltip>
            )}
            {expanded ? <EscapeListener onEscape={onCollapse} /> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

const DesktopPoll: React.FunctionComponent = () => {
  const poll = usePoll();

  const [measureRef, { height }] = useMeasure<HTMLDivElement>();

  const [didScroll, setDidScroll] = React.useState(false);

  const { canAddNewParticipant } = usePermissions();
  const [expanded, setExpanded] = React.useState(false);

  const expand = React.useCallback(() => {
    document.body.style.overflow = "hidden";
    setExpanded(true);
  }, []);

  const collapse = React.useCallback(() => {
    // enable scrolling on body
    document.body.style.overflow = "";
    setExpanded(false);
  }, []);

  const { t } = useTranslation();
  const votingForm = useVotingForm();
  const mode = votingForm.watch("mode");

  const { participants } = useParticipants();
  const visibleParticipants = useVisibleParticipants();

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [isOverflowing, setIsOverflowing] = React.useState(false);

  const { x } = useScroll(scrollRef as React.RefObject<HTMLElement>);

  const containerRef = React.useRef<HTMLDivElement>(null);

  useClickAway(containerRef, () => {
    collapse();
  });

  const goToNextPage = React.useCallback(() => {
    setDidScroll(true);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollLeft + 235,
        behavior: "smooth",
      });
    }
  }, []);

  const goToPreviousPage = React.useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollLeft - 235,
        behavior: "smooth",
      });
    }
  }, []);

  return (
    <Card>
      <div ref={measureRef} style={{ height: expanded ? height : undefined }}>
        <div
          className={cn(
            expanded
              ? "fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center p-8"
              : "",
          )}
        >
          <div
            className={cn(
              "flex max-h-full flex-col overflow-hidden rounded-2xl",
              {
                "w-full max-w-7xl border border-popover-border bg-background shadow-2xl":
                  expanded,
              },
            )}
            ref={containerRef}
          >
            <CardHeader className="flex items-center justify-between gap-4 border-b">
              <div className="flex items-center gap-x-2.5">
                <CardTitle>
                  <Trans i18nKey="participants" />
                </CardTitle>
                <Badge>{participants.length}</Badge>
                {canAddNewParticipant && mode !== "new" ? (
                  <Button
                    className="ml-2"
                    size="icon-xs"
                    data-testid="add-participant-button"
                    onClick={() => {
                      votingForm.newParticipant();
                    }}
                  >
                    <Icon>
                      <PlusIcon />
                    </Icon>
                  </Button>
                ) : null}
              </div>
              <TableControls
                optionCount={poll.options.length}
                showTimeZone={
                  poll.options[0]?.duration !== 0 && !!poll.timeZone
                }
                showScrollControls={isOverflowing}
                canScrollPrev={x > 0}
                canScrollNext={
                  !scrollRef.current ||
                  x + scrollRef.current.offsetWidth <
                    scrollRef.current.scrollWidth
                }
                showScrollIndicator={!didScroll}
                expanded={expanded}
                onExpand={expand}
                onCollapse={collapse}
                onGoToPreviousPage={goToPreviousPage}
                onGoToNextPage={goToNextPage}
              />
            </CardHeader>
            <div className="flex min-h-0 flex-1 flex-col">
              {participants.length > 0 || mode !== "view" ? (
                <div className="relative flex min-h-0 flex-1 flex-col">
                  <div
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute top-0 bottom-3 left-[235px] z-30 w-4 border-l bg-linear-to-r from-gray-800/5 via-transparent to-transparent transition-opacity",
                      x > 0 ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <ScrollContainer
                    onScroll={() => {
                      if (!didScroll) {
                        setDidScroll(true);
                      }
                    }}
                    onOverflowChange={(isOverflowing) => {
                      setIsOverflowing(isOverflowing);
                    }}
                    ref={scrollRef}
                    className={cn(
                      "scrollbar-thin dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative z-10 h-full min-h-0 grow overflow-auto overscroll-x-none",
                    )}
                  >
                    <table className="w-full table-auto border-separate border-spacing-0">
                      <thead>
                        <PollHeader />
                      </thead>
                      <tbody className="relative">
                        {mode === "new" ? (
                          <ParticipantRowForm isNew={true} />
                        ) : null}
                        {visibleParticipants.length > 0
                          ? visibleParticipants.map((participant, i) => {
                              return (
                                <ParticipantRow
                                  key={participant.id}
                                  participant={{
                                    id: participant.id,
                                    name: participant.name,
                                    userId: participant.userId ?? undefined,
                                    email: participant.email ?? undefined,
                                    image: participant.image,
                                    votes: participant.votes,
                                  }}
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
                  </ScrollContainer>
                </div>
              ) : (
                <EmptyState className="p-16">
                  <EmptyStateIcon>
                    <Users2Icon />
                  </EmptyStateIcon>
                  <EmptyStateTitle>
                    <Trans
                      i18nKey="noParticipants"
                      defaults="No participants"
                    />
                  </EmptyStateTitle>
                  <EmptyStateDescription>
                    <Trans
                      i18nKey="noParticipantsDescription"
                      components={{ b: <strong className="font-semibold" /> }}
                      defaults="Click <b>Share</b> to invite participants"
                    />
                  </EmptyStateDescription>
                </EmptyState>
              )}
              {mode === "new" ? (
                <div className="flex items-center justify-between gap-4 border-t p-3">
                  <Button
                    onClick={() => {
                      votingForm.cancel();
                    }}
                  >
                    <Trans i18nKey="cancel" />
                  </Button>
                  <p className="hidden min-w-0 truncate text-sm md:block">
                    <Trans
                      i18nKey="saveInstruction"
                      values={{
                        action: mode === "new" ? t("continue") : t("save"),
                      }}
                      components={{
                        b: <strong className="font-semibold" />,
                      }}
                    />
                  </p>
                  <Button type="submit" variant="primary" form="voting-form">
                    <Trans i18nKey="continue" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DesktopPoll;
