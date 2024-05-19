import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@rallly/ui/card";
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
import { Trans } from "next-i18next";
import * as React from "react";
import { RemoveScroll } from "react-remove-scroll";
import { useMeasure, useScroll } from "react-use";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { useTranslation } from "@/app/i18n/client";
import { TimesShownIn } from "@/components/clock";
import { useVotingForm } from "@/components/poll/voting-form";
import { usePermissions } from "@/contexts/permissions";
import { usePoll } from "@/contexts/poll";

import {
  useParticipants,
  useVisibleParticipants,
} from "../participants-provider";
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
  const poll = usePoll();

  const [measureRef, { height }] = useMeasure<HTMLDivElement>();

  const goToNextPage = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += 240;
    }
  };

  const { canAddNewParticipant } = usePermissions();
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
  const { t } = useTranslation();
  const votingForm = useVotingForm();
  const mode = votingForm.watch("mode");

  const { participants } = useParticipants();
  const visibleParticipants = useVisibleParticipants();

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const isOverflowing = useIsOverflowing(scrollRef);

  const { x } = useScroll(scrollRef);

  function TableControls() {
    return (
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground text-sm">
          <Trans
            i18nKey="optionCount"
            values={{ count: poll.options.length }}
          />
        </div>
        <div className="flex gap-x-1">
          {isOverflowing ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={x === 0}
                    onClick={goToPreviousPage}
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
                    variant="ghost"
                    size="sm"
                    disabled={Boolean(
                      scrollRef.current &&
                        x + scrollRef.current.offsetWidth >=
                          scrollRef.current.scrollWidth,
                    )}
                    onClick={() => {
                      goToNextPage();
                    }}
                  >
                    <Icon>
                      <ArrowRightIcon />
                    </Icon>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <Trans i18nKey="scrollRight" defaults="Scroll Right" />
                </TooltipContent>
              </Tooltip>
            </>
          ) : null}
          {expanded ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    collapse();
                  }}
                >
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    expand();
                  }}
                >
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
        </div>
      </div>
    );
  }

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
              "flex max-h-full max-w-7xl flex-col overflow-hidden rounded-md bg-white",
              {
                "shadow-huge": expanded,
              },
            )}
          >
            <CardHeader className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-x-2.5">
                <CardTitle>
                  <Trans i18nKey="participants" />
                </CardTitle>
                <Badge>{participants.length}</Badge>
                {canAddNewParticipant && mode !== "new" ? (
                  <Button
                    className="ml-2"
                    size="sm"
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
              <TableControls />
            </CardHeader>
            {poll.options[0]?.duration !== 0 && poll.timeZone ? (
              <CardHeader>
                <TimesShownIn />
              </CardHeader>
            ) : null}
            {participants.length > 0 || mode !== "view" ? (
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
                  <table className="w-full table-auto border-separate border-spacing-0  ">
                    <thead>
                      <PollHeader />
                    </thead>
                    <tbody>
                      {mode === "new" ? (
                        <ParticipantRowForm isNew={true} />
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
            ) : (
              <EmptyState className="p-16">
                <EmptyStateIcon>
                  <Users2Icon />
                </EmptyStateIcon>
                <EmptyStateTitle>
                  <Trans i18nKey="noParticipants" defaults="No participants" />
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
              <CardFooter className="flex items-center justify-between">
                <Button
                  onClick={() => {
                    votingForm.cancel();
                  }}
                >
                  <Trans i18nKey="cancel" />
                </Button>
                <p className="text-sm">
                  <Trans
                    i18nKey="saveInstruction"
                    values={{
                      action: mode === "new" ? t("continue") : t("save"),
                    }}
                    components={{ b: <strong className="font-semibold" /> }}
                  />
                </p>
                <Button type="submit" variant="primary" form="voting-form">
                  <Trans i18nKey="continue" />
                </Button>
              </CardFooter>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DesktopPoll;
