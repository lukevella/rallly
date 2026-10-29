"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { Field, FieldLabel } from "@rallly/ui/field";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { toast } from "@rallly/ui/sonner";
import { Textarea } from "@rallly/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { cancelPlanAction } from "@/features/billing/actions";
import { CANCELLATION_COMMENT_MAX_LENGTH } from "@/features/billing/constants";
import type { CancellationReason } from "@/features/billing/schema";
import { cancellationReasonSchema } from "@/features/billing/schema";
import { Trans, useTranslation } from "@/i18n/client";

function ReasonOption({
  value,
  children,
}: {
  value: CancellationReason;
  children: React.ReactNode;
}) {
  const id = `cancel-plan-reason-${value}`;
  return (
    <Field orientation="horizontal">
      <RadioGroupItem value={value} id={id} />
      <FieldLabel htmlFor={id} className="font-normal">
        {children}
      </FieldLabel>
    </Field>
  );
}

export function CancelPlanDialog({
  children,
  periodEnd,
  ...dialogProps
}: DialogProps & {
  /** Formatted date the plan stays active until. */
  periodEnd: string;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = React.useState<CancellationReason | null>(null);
  const [comment, setComment] = React.useState("");
  const cancelPlan = useMutation(
    mutationOptions(cancelPlanAction, {
      onSuccess: () => {
        dialogProps.onOpenChange?.(false);
        toast.success(
          t("planCancelScheduledAlertTitle", {
            defaultValue: "Cancellation scheduled",
          }),
          {
            description: t("planCancelScheduledAlertDescription", {
              defaultValue:
                "Your plan stays active until the end of the current billing period. You can resume it any time before then.",
            }),
          },
        );
      },
    }),
  );

  return (
    <Dialog {...dialogProps}>
      {children}
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="cancelPlan" defaults="Cancel plan" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="cancelPlanDialogDescription"
              defaults="Your plan stays active until {date}. Before you go, what's the main reason you're cancelling?"
              values={{ date: periodEnd }}
            />
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          aria-label={t("cancelPlanReasonLabel", {
            defaultValue: "Reason for cancelling",
          })}
          value={reason}
          onValueChange={(value) => {
            const parsed = cancellationReasonSchema.safeParse(value);
            if (parsed.success) {
              setReason(parsed.data);
            }
          }}
        >
          <ReasonOption value="one_off_event">
            <Trans
              i18nKey="cancelReasonOneOffEvent"
              defaults="I only needed it for one event"
            />
          </ReasonOption>
          <ReasonOption value="not_using">
            <Trans
              i18nKey="cancelReasonNotUsing"
              defaults="I'm not using it enough"
            />
          </ReasonOption>
          <ReasonOption value="too_expensive">
            <Trans
              i18nKey="cancelReasonTooExpensive"
              defaults="It's too expensive"
            />
          </ReasonOption>
          <ReasonOption value="missing_features">
            <Trans
              i18nKey="cancelReasonMissingFeatures"
              defaults="It's missing something I need"
            />
          </ReasonOption>
          <ReasonOption value="switched_service">
            <Trans
              i18nKey="cancelReasonSwitchedService"
              defaults="I'm switching to another tool"
            />
          </ReasonOption>
          <ReasonOption value="other">
            <Trans i18nKey="cancelReasonOther" defaults="Something else" />
          </ReasonOption>
        </RadioGroup>
        <Field>
          <FieldLabel htmlFor="cancel-plan-comment">
            <Trans
              i18nKey="cancelPlanCommentLabel"
              defaults="Anything else we should know? (optional)"
            />
          </FieldLabel>
          <Textarea
            id="cancel-plan-comment"
            className="min-h-16"
            maxLength={CANCELLATION_COMMENT_MAX_LENGTH}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </Field>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={!reason}
            loading={cancelPlan.isPending}
            onClick={() => {
              if (reason) {
                cancelPlan.mutate({ reason, comment });
              }
            }}
          >
            <Trans i18nKey="cancelPlan" defaults="Cancel plan" />
          </Button>
          <DialogClose render={<Button />}>
            <Trans i18nKey="keepPlan" defaults="Keep plan" />
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
