import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { CardFooter } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExpandIcon,
  ShrinkIcon,
} from "lucide-react";
import { Trans } from "next-i18next";
import * as React from "react";
import { RemoveScroll } from "react-remove-scroll";
import { useMeasure, useScroll } from "react-use";

import { useVotingForm } from "@/components/poll/voting-form";

import { useVisibleParticipants } from "../participants-provider";
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
  const { poll } = usePoll();

  const votingForm = useVotingForm();

  const mode = votingForm.watch("mode");

  const [measureRef, { height }] = useMeasure<HTMLDivElement>();

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
          className={cn("flex max-h-full flex-col overflow-hidden rounded-md", {
            "shadow-huge": expanded,
          })}
        >
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

          <CardFooter className="flex items-center justify-between">
            <div className="text-sm font-medium">
              <Trans
                i18nKey="optionCount"
                values={{ count: poll.options.length }}
              />
            </div>
            <div className="flex gap-x-2.5">
              {isOverflowing ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
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
          </CardFooter>
        </div>
      </div>
    </div>
  );
};

export default DesktopPoll;
