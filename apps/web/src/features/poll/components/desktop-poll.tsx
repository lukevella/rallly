"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { PlusIcon, Share2Icon, Users2Icon } from "lucide-react";
import * as React from "react";
import { useScroll } from "react-use";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { ScrollContainer } from "@/components/scroll-container";
import {
  useParticipants,
  usePermissions,
  usePoll,
  useRole,
} from "@/features/poll/client";
import {
  SharePollDialog,
  useSharePollDialog,
} from "@/features/poll/components/share-dialog";
import { useVisibleParticipants } from "@/features/poll/components/visibility";
import { VotingFooter } from "@/features/poll/components/voting-footer";
import { useVotingForm } from "@/features/poll/components/voting-form";
import { Trans } from "@/i18n/client";
import { GridHoverHighlight } from "./desktop-poll/grid-hover-highlight";
import ParticipantRow from "./desktop-poll/participant-row";
import PollHeader from "./desktop-poll/poll-header";

// Only admins see it, and the share dialog reads the space tier, which public
// poll pages don't provide
function EmptyStateShareButton() {
  const poll = usePoll();
  const { dialog, open } = useSharePollDialog(poll.id);

  return (
    <>
      <Button {...dialog.triggerProps} onClick={() => open("empty_state")}>
        <Share2Icon data-icon="inline-start" />
        <Trans i18nKey="share" defaults="Share" />
      </Button>
      <SharePollDialog
        {...dialog.dialogProps}
        pollId={poll.id}
        pollStatus={poll.status}
        inviteLink={poll.inviteLink}
      />
    </>
  );
}

function DesktopPollEmptyState() {
  const role = useRole();
  const { canAddNewParticipant } = usePermissions();
  const votingForm = useVotingForm();
  const canShare = role === "admin";

  return (
    <EmptyState className="p-16">
      <EmptyStateIcon>
        <Users2Icon />
      </EmptyStateIcon>
      <EmptyStateTitle>
        <Trans i18nKey="noResponses" defaults="No responses" />
      </EmptyStateTitle>
      {canAddNewParticipant || canShare ? (
        <EmptyStateDescription>
          {canAddNewParticipant && canShare ? (
            <Trans
              i18nKey="desktopPollEmptyStateDescription"
              components={{ b: <strong className="font-semibold" /> }}
              defaults="Click <b>+</b> to add a response or <b>Share</b> to invite participants"
            />
          ) : canAddNewParticipant ? (
            <Trans
              i18nKey="desktopPollEmptyStateAddDescription"
              components={{ b: <strong className="font-semibold" /> }}
              defaults="Click <b>+</b> to add a response"
            />
          ) : (
            <Trans
              i18nKey="noParticipantsDescription"
              components={{ b: <strong className="font-semibold" /> }}
              defaults="Click <b>Share</b> to invite participants"
            />
          )}
        </EmptyStateDescription>
      ) : null}
      {canAddNewParticipant || canShare ? (
        <EmptyStateFooter className="flex gap-2">
          {canAddNewParticipant ? (
            <Button onClick={() => votingForm.newParticipant()}>
              <PlusIcon data-icon="inline-start" />
              <Trans i18nKey="addResponse" defaults="Add response" />
            </Button>
          ) : null}
          {canShare ? <EmptyStateShareButton /> : null}
        </EmptyStateFooter>
      ) : null}
    </EmptyState>
  );
}

const DesktopPoll = ({
  className,
  headerStart,
}: {
  className?: string;
  /** Rendered in the table's top-left corner, for a page control such as a panel toggle. */
  headerStart?: React.ReactNode;
}) => {
  const votingForm = useVotingForm();
  const mode = votingForm.watch("mode");

  // Escape abandons the response being written or edited.
  React.useEffect(() => {
    if (mode === "view") {
      return;
    }
    const cancel = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        votingForm.cancel();
      }
    };
    window.addEventListener("keydown", cancel);
    return () => window.removeEventListener("keydown", cancel);
  }, [mode, votingForm]);

  const { participants } = useParticipants();
  const visibleParticipants = useVisibleParticipants();

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);

  const { x } = useScroll(scrollRef as React.RefObject<HTMLElement>);

  return (
    // The flex chain lets a flex parent with a bounded height (the invite
    // page on large screens) stretch the card to fill it, so the table
    // scrolls inside and the voting footer sits at the bottom edge. In a
    // block parent none of this has any effect.
    <Card className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          {participants.length > 0 || mode !== "view" ? (
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute top-0 bottom-3 left-[235px] z-30 w-4 bg-linear-to-r from-gray-800/5 via-transparent to-transparent transition-opacity",
                  x > 0 ? "opacity-100" : "opacity-0",
                )}
              />
              <GridHoverHighlight tableRef={tableRef} />
              <ScrollContainer
                ref={scrollRef}
                className={cn(
                  "scrollbar-thin dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative z-10 h-full min-h-0 grow overflow-auto overscroll-none",
                )}
              >
                <table
                  ref={tableRef}
                  className="poll-grid w-full table-auto border-separate border-spacing-0 cursor-default [--grid-hover:var(--color-gray-100)] dark:[--grid-hover:var(--color-gray-800)]"
                >
                  <thead>
                    <PollHeader cornerStart={headerStart} />
                  </thead>
                  <tbody className="relative">
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
                                editUrl: participant.editUrl,
                                note: participant.note,
                                createdAt: participant.createdAt,
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
            <DesktopPollEmptyState />
          )}
          {mode !== "view" ? (
            <div className="border-t bg-muted/40 p-3">
              <VotingFooter onCancel={() => votingForm.cancel()} />
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

export default DesktopPoll;
