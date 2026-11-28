"use client";

import { posthog } from "@rallly/posthog/client";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
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
import { toast } from "@rallly/ui/sonner";
import { SuccessCheck, SuccessCheckIcon } from "@rallly/ui/success-check";
import { AlertTriangleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { primePayWall, usePayWallStore } from "@/features/billing/client";
import { PayWallDialog } from "@/features/billing/components/pay-wall-dialog";
import { useParticipants, usePoll } from "@/features/poll/client";
import {
  PickedDateText,
  SummaryStep,
} from "@/features/poll/components/finalize-poll-dialog";
import {
  pollEventProperties,
  rankOptionsByPopularity,
} from "@/features/poll/utils";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { NotifyParticipantsCombobox } from "./notify-participants-combobox";

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
          <Trans i18nKey="finalizeDialogFinalizeTitle" defaults="Finalize" />
        </DialogTitle>
        <DialogDescription>
          <Trans
            i18nKey="finalizeDialogDescription"
            defaults="Select which participants to notify"
          />
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col">
        <div className="pt-2 pb-6">
          <SummaryStep option={option} showPendingLink />
        </div>
        {participants.length > 0 ? (
          <NotifyParticipantsCombobox
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
