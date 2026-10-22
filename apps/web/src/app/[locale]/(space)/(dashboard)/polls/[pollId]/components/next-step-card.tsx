"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { CalendarCheck2Icon, UserPlusIcon } from "lucide-react";
import { Link } from "@/components/link";
import { usePoll } from "@/features/poll/client";
import { FinalizePollDialog } from "@/features/poll/components/finalize-poll-dialog";
import {
  SharePollDialog,
  useSharePollDialog,
} from "@/features/poll/components/share-dialog";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans } from "@/i18n/client";

type Slot = { startTime: Date; duration: number };

function SlotLabel({
  slot,
  timeZone,
}: {
  slot: Slot;
  timeZone: string | null;
}) {
  const allDay = slot.duration === 0;
  return (
    <>
      <EventDate
        value={slot.startTime}
        allDay={allDay}
        timeZone={timeZone}
        preset="weekdayMonthDayShort"
      />
      {allDay ? null : (
        <>
          {" · "}
          <EventTimeRange
            start={slot.startTime}
            end={new Date(slot.startTime.getTime() + slot.duration * 60_000)}
            allDay={false}
            timeZone={timeZone}
          />
        </>
      )}
    </>
  );
}

/**
 * The single most useful thing the host can do with the poll right now,
 * chosen by its state. Finalize lives here rather than in the header.
 */
export function NextStepCard({
  leading,
  tiedCount,
  responseCount,
}: {
  /** The top ranked option, if anyone is available for any option. */
  leading: Slot | null;
  /** How many options share the top score (1 when there is a clear lead). */
  tiedCount: number;
  responseCount: number;
}) {
  const poll = usePoll();
  const share = useSharePollDialog(poll.id);
  const finalizeDialog = useDialog();
  const canFinalize = poll.status === "open" || poll.status === "closed";

  const finalize = (
    <Button
      size="sm"
      variant={leading ? "primary" : "default"}
      onClick={() => {
        posthog?.capture("poll_finalize:dialog_open");
        finalizeDialog.trigger();
      }}
    >
      <CalendarCheck2Icon data-icon="inline-start" />
      <Trans i18nKey="finalize" defaults="Finalize" />
    </Button>
  );

  const invite = (
    <Button size="sm" variant="primary" onClick={() => share.open("manual")}>
      <UserPlusIcon data-icon="inline-start" />
      <Trans
        i18nKey="pollDescriptionCardInviteParticipants"
        defaults="Invite participants"
      />
    </Button>
  );

  const body = (() => {
    switch (poll.status) {
      case "canceled":
        return (
          <p className="text-muted-foreground">
            <Trans
              i18nKey="pollNextStepCanceled"
              defaults="This poll was canceled."
            />
          </p>
        );
      case "scheduled":
        return (
          <>
            <div className="space-y-0.5">
              <p className="text-muted-foreground">
                <Trans
                  i18nKey="pollNextStepScheduled"
                  defaults="Scheduled for"
                />
              </p>
              {poll.event ? (
                <p className="font-medium">
                  <SlotLabel
                    slot={{
                      startTime: poll.event.start,
                      duration: poll.event.duration,
                    }}
                    timeZone={poll.timeZone}
                  />
                </p>
              ) : null}
            </div>
            <div>
              <Link
                href="/events"
                className={buttonVariants({ size: "sm", variant: "primary" })}
              >
                <Trans i18nKey="pollNextStepGoToEvent" defaults="Go to event" />
              </Link>
            </div>
          </>
        );
      case "closed":
        if (poll.closedReason === "auto") {
          return (
            <p className="text-muted-foreground">
              <Trans
                i18nKey="pollNextStepAllPassed"
                defaults="Every option has passed."
              />
            </p>
          );
        }
        break;
    }

    return (
      <>
        <div className="space-y-0.5">
          {poll.status === "closed" ? (
            <p className="text-muted-foreground">
              <Trans
                i18nKey="pollNextStepClosed"
                defaults="Responses are closed."
              />
            </p>
          ) : null}
          {leading ? (
            <>
              <p className="text-muted-foreground">
                {tiedCount > 1 ? (
                  <Trans
                    i18nKey="pollNextStepTied"
                    defaults="{count} options are tied for the lead"
                    values={{ count: tiedCount }}
                  />
                ) : (
                  <Trans
                    i18nKey="pollNextStepLeading"
                    defaults="Leading option"
                  />
                )}
              </p>
              <p className="font-medium">
                <SlotLabel slot={leading} timeZone={poll.timeZone} />
              </p>
            </>
          ) : responseCount > 0 ? (
            <p className="text-muted-foreground">
              <Trans
                i18nKey="pollNextStepNobodyAvailable"
                defaults="Nobody is available for any option yet."
              />
            </p>
          ) : (
            <p className="text-muted-foreground">
              <Trans
                i18nKey="pollNextStepNoResponses"
                defaults="Nobody has responded yet."
              />
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {leading ? (
            finalize
          ) : (
            <>
              {poll.status === "open" ? invite : null}
              {canFinalize ? finalize : null}
            </>
          )}
        </div>
      </>
    );
  })();

  return (
    <div className="space-y-3">
      {body}
      <SharePollDialog
        {...share.dialog.dialogProps}
        pollId={poll.id}
        pollStatus={poll.status}
        inviteLink={poll.inviteLink}
      />
      {canFinalize ? (
        <FinalizePollDialog {...finalizeDialog.dialogProps} />
      ) : null}
    </div>
  );
}
