"use client";

import { posthog } from "@rallly/posthog/client";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { Checkbox } from "@rallly/ui/checkbox";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { Label } from "@rallly/ui/label";
import { toast } from "@rallly/ui/sonner";
import { SuccessCheck, SuccessCheckIcon } from "@rallly/ui/success-check";
import { AlertTriangleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { primePayWall, usePayWallStore } from "@/features/billing/client";
import { PayWallDialog } from "@/features/billing/components/pay-wall-dialog";
import { useParticipants, usePoll } from "@/features/poll/client";
import {
  PickedDateText,
  SummaryStep,
} from "@/features/poll/components/finalize-poll-dialog";
import type { VoteType } from "@/features/poll/constants";
import type { PollParticipant } from "@/features/poll/types";
import {
  pollEventProperties,
  rankOptionsByPopularity,
} from "@/features/poll/utils";
import { EventDate } from "@/features/scheduled-event/components/event-date-time";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

/**
 * Finalizes the poll on a date already picked, in one step: what the event
 * will carry, then who to notify. The legacy page keeps the
 * multi-step wizard in `features/poll/components/finalize-poll-dialog.tsx`.
 */
export function FinalizeDialog({
  optionId,
  ...props
}: DialogProps & { optionId: string }) {
  const poll = usePoll();
  const [done, setDone] = React.useState(false);
  const onOpenChange = (open: boolean) => {
    if (!open && !done) {
      posthog?.capture("poll_finalize:dialog_dismiss", {
        step: "notify",
        ...pollEventProperties({ pollId: poll.id, spaceId: poll.spaceId }),
      });
    }
    props.onOpenChange?.(open);
  };
  return (
    <Dialog
      {...props}
      onOpenChange={onOpenChange}
      // Reset once the close animation ends, so the closing dialog keeps
      // showing what it was on.
      onOpenChangeComplete={(open) => {
        if (!open) setDone(false);
      }}
    >
      <DialogContent className="w-auto sm:max-w-none">
        <FinalizeContent
          optionId={optionId}
          done={done}
          onDone={() => setDone(true)}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// Mounted fresh with each open, so the selection starts from everyone with
// an email.
function FinalizeContent({
  optionId,
  done,
  onDone,
  onClose,
}: {
  optionId: string;
  done: boolean;
  onDone: () => void;
  onClose: () => void;
}) {
  const poll = usePoll();
  const { participants } = useParticipants();
  const router = useRouter();
  // The pay wall nests inside the dialog so it stacks above it.
  const payWall = useDialog();
  const payWallPricing = usePayWallStore((state) => state.pricing);
  const option = React.useMemo(
    () =>
      rankOptionsByPopularity({ options: poll.options, participants }).find(
        (o) => o.id === optionId,
      ),
    [poll.options, participants, optionId],
  );
  const [notifyIds, setNotifyIds] = React.useState(
    () => new Set(participants.filter((p) => p.email).map((p) => p.id)),
  );
  const [skippedNotifications, setSkippedNotifications] = React.useState(0);

  const finalize = trpc.polls.book.useMutation({
    onSuccess: (data) => {
      setSkippedNotifications(data?.skippedNotifications ?? 0);
      onDone();
      // The page behind the dialog picks up the scheduled status.
      router.refresh();
    },
    onError: (error) => {
      if (error.data?.code === "PAYMENT_REQUIRED") {
        primePayWall({
          from: "finalize-dialog",
          action: "finalize",
          pollId: poll.id,
        });
        payWall.trigger();
        return;
      }
      toast.error(
        <Trans
          i18nKey="finalizePollError"
          defaults="Failed to finalize poll"
        />,
      );
    },
  });

  if (!option) {
    return null;
  }

  if (done) {
    return (
      <div className="grid w-[calc(100vw-4rem)] gap-4 sm:w-[26rem]">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <SuccessCheck state="in">
            <SuccessCheckIcon />
          </SuccessCheck>
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="finalizeSuccessTitle" defaults="Date scheduled" />
            </DialogTitle>
            <DialogDescription>
              <PickedDateText option={option} />
            </DialogDescription>
          </DialogHeader>
        </div>
        {skippedNotifications > 0 ? (
          <Alert variant="warning">
            <AlertTriangleIcon />
            <AlertDescription>
              <Trans
                i18nKey="finalizeNotifyBudgetSkipped"
                defaults="{count, plural, one {# participant wasn't emailed} other {# participants weren't emailed}} because this account reached its daily email limit. Share the poll link with them instead."
                values={{ count: skippedNotifications }}
              />
            </AlertDescription>
          </Alert>
        ) : null}
        <Button className="w-full" onClick={onClose}>
          <Trans i18nKey="backToPoll" defaults="Back to poll" />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid w-[calc(100vw-4rem)] gap-4 sm:w-[40rem]">
      <DialogHeader>
        <DialogTitle>
          <Trans
            i18nKey="finalizeDialogTitle"
            defaults="Schedule for <date />"
            components={{
              date: (
                <EventDate
                  value={option.startTime}
                  allDay={option.duration === 0}
                  timeZone={poll.timeZone}
                  preset="dateFull"
                />
              ),
            }}
          />
        </DialogTitle>
        <DialogDescription>{poll.title}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col">
        <div className="pt-2 pb-6">
          <SummaryStep option={option} showDate={false} />
        </div>
        {participants.length > 0 ? (
          <NotifyList
            optionId={option.id}
            selectedIds={notifyIds}
            onChange={setNotifyIds}
          />
        ) : (
          <p className="rounded-xl border border-card-border p-4 text-muted-foreground text-sm">
            <Trans
              i18nKey="finalizeDialogNoParticipants"
              defaults="No one has responded, so there's no one to notify."
            />
          </p>
        )}
      </div>
      <PayWallDialog
        pricing={payWallPricing}
        isOpen={payWall.dialogProps.open}
        onOpenChange={payWall.dialogProps.onOpenChange}
      />
      <DialogFooter>
        <Button onClick={onClose}>
          <Trans i18nKey="cancel" defaults="Cancel" />
        </Button>
        <Button
          variant="primary"
          loading={finalize.isPending}
          onClick={() => {
            finalize.mutate({
              pollId: poll.id,
              optionId: option.id,
              notifyParticipantIds: Array.from(notifyIds),
            });
          }}
        >
          <Trans
            i18nKey="finalizeAndNotify"
            defaults="{count, plural, =0 {Finalize} one {Finalize and notify # participant} other {Finalize and notify # participants}}"
            values={{ count: notifyIds.size }}
          />
        </Button>
      </DialogFooter>
    </div>
  );
}

type NotifyGroup = "yes" | "ifNeedBe" | "no" | "noAnswer" | "noEmail";

const groupOrder: NotifyGroup[] = [
  "yes",
  "ifNeedBe",
  "no",
  "noAnswer",
  "noEmail",
];

function groupOf(participant: PollParticipant, optionId: string): NotifyGroup {
  if (!participant.email) {
    return "noEmail";
  }
  const vote: VoteType | undefined = participant.votes.find(
    (v) => v.optionId === optionId,
  )?.type;
  return vote ?? "noAnswer";
}

function GroupLabel({ group, count }: { group: NotifyGroup; count: number }) {
  const label = {
    yes: <Trans i18nKey="finalizeGroupAvailable" defaults="Available" />,
    ifNeedBe: <Trans i18nKey="finalizeGroupIfNeedBe" defaults="If need be" />,
    no: <Trans i18nKey="finalizeGroupNo" defaults="Can't make it" />,
    noAnswer: <Trans i18nKey="finalizeGroupNoAnswer" defaults="No answer" />,
    noEmail: <Trans i18nKey="finalizeGroupNoEmail" defaults="No email" />,
  }[group];
  return (
    <p className="px-4 pt-3 pb-1 text-muted-foreground text-xs">
      {label} <span className="tabular-nums">({count})</span>
    </p>
  );
}

/**
 * Who to email the final date, grouped by how they answered for it. People
 * without an email are listed last and can't be selected.
 */
function NotifyList({
  optionId,
  selectedIds,
  onChange,
}: {
  optionId: string;
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const poll = usePoll();
  const { participants } = useParticipants();
  const groups = React.useMemo(() => {
    const byGroup = new Map<NotifyGroup, PollParticipant[]>();
    for (const participant of participants) {
      const group = groupOf(participant, optionId);
      byGroup.set(group, [...(byGroup.get(group) ?? []), participant]);
    }
    return groupOrder.flatMap((group) => {
      const members = byGroup.get(group);
      return members ? [{ group, members }] : [];
    });
  }, [participants, optionId]);
  const notifiableIds = participants.filter((p) => p.email).map((p) => p.id);
  const selectedCount = notifiableIds.filter((id) =>
    selectedIds.has(id),
  ).length;
  const allSelected =
    notifiableIds.length > 0 && selectedCount === notifiableIds.length;

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    onChange(next);
  };

  return (
    <section aria-labelledby="finalize-notify" className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h3 id="finalize-notify" className="font-medium text-sm">
            <Trans
              i18nKey="notifyParticipants"
              defaults="Notify participants"
            />
          </h3>
          <p className="text-muted-foreground text-sm">
            <Trans
              i18nKey="finalizeDialogNotifyDescription"
              defaults="They'll get an email with the date and a calendar invite."
            />
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Checkbox
            id="finalize-notify-all"
            checked={allSelected}
            indeterminate={!allSelected && selectedCount > 0}
            disabled={notifiableIds.length === 0}
            onCheckedChange={(checked) => {
              posthog?.capture("poll_finalize:select_all_click", {
                selected: checked,
                ...pollEventProperties({
                  pollId: poll.id,
                  spaceId: poll.spaceId,
                }),
              });
              onChange(new Set(checked ? notifiableIds : []));
            }}
          />
          <Label htmlFor="finalize-notify-all" className="text-sm">
            <Trans
              i18nKey="notifySelectedCount"
              defaults="{count, plural, =0 {Select all} one {# selected} other {# selected}}"
              values={{ count: selectedCount }}
            />
          </Label>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-card-border bg-card">
        <div className="max-h-72 overflow-y-auto pb-2">
          {groups.map(({ group, members }) => (
            <div key={group}>
              <GroupLabel group={group} count={members.length} />
              <ul className="px-2">
                {members.map((participant) => (
                  <li
                    key={participant.id}
                    className="relative flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 hover:bg-foreground/[0.03] has-disabled:hover:bg-transparent"
                  >
                    <Checkbox
                      id={`finalize-notify-${participant.id}`}
                      className="relative z-10"
                      checked={selectedIds.has(participant.id)}
                      disabled={!participant.email}
                      onCheckedChange={(checked) =>
                        toggle(participant.id, checked)
                      }
                    />
                    {/* Stretched over the row, so the whole row toggles. */}
                    <Label
                      htmlFor={`finalize-notify-${participant.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 after:absolute after:inset-0 after:rounded-lg"
                    >
                      <OptimizedAvatarImage
                        size="sm"
                        name={participant.name}
                        src={participant.image ?? undefined}
                      />
                      <span className="min-w-0 truncate text-sm">
                        {participant.name}
                      </span>
                      {participant.email ? (
                        <span className="ml-auto min-w-0 truncate text-muted-foreground text-sm">
                          {participant.email}
                        </span>
                      ) : null}
                    </Label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
