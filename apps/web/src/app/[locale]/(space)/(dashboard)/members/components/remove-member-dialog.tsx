"use client";

import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@rallly/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import React from "react";
import { Trans } from "@/i18n/client";

export type RemovalRecipient = {
  id: string;
  name: string;
  isActor: boolean;
};

export function RemoveMemberDialog({
  memberName,
  openPollCount,
  liveEventCount,
  recipients,
  pending,
  onConfirm,
  ...dialogProps
}: {
  memberName: string;
  openPollCount: number;
  liveEventCount: number;
  // Current, effective members other than the one leaving. The admin doing
  // the removing is the pre-fill: present, and usually the manager.
  recipients: RemovalRecipient[];
  pending: boolean;
  onConfirm: (toMemberId: string) => void;
} & Pick<React.ComponentProps<typeof Dialog>, "open" | "onOpenChange">) {
  const defaultRecipientId =
    recipients.find((recipient) => recipient.isActor)?.id ??
    recipients[0]?.id ??
    "";
  const [toMemberId, setToMemberId] = React.useState(defaultRecipientId);
  const hasLiveContent = openPollCount > 0 || liveEventCount > 0;

  return (
    <Dialog {...dialogProps}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="removeMember" defaults="Remove member" />
          </DialogTitle>
          <DialogDescription>
            {hasLiveContent ? (
              <Trans
                i18nKey="removeMemberTransferDescription"
                defaults="{name} will lose access to this space immediately. They created {pollCount, plural, =0 {no open polls} one {# open poll} other {# open polls}} and {eventCount, plural, =0 {no upcoming events} one {# upcoming event} other {# upcoming events}} here. Choose who takes them over."
                values={{
                  name: memberName,
                  pollCount: openPollCount,
                  eventCount: liveEventCount,
                }}
              />
            ) : (
              <Trans
                i18nKey="removeMemberConfirmation"
                defaults="Are you sure you want to remove this member?"
              />
            )}
          </DialogDescription>
        </DialogHeader>
        {hasLiveContent ? (
          <Field>
            <FieldLabel htmlFor="remove-member-transfer-to">
              <Trans i18nKey="removeMemberTransferTo" defaults="Transfer to" />
            </FieldLabel>
            <Select
              items={Object.fromEntries(
                recipients.map((recipient) => [recipient.id, recipient.name]),
              )}
              value={toMemberId}
              onValueChange={(value) => {
                if (value) {
                  setToMemberId(value);
                }
              }}
            >
              <SelectTrigger id="remove-member-transfer-to" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((recipient) => (
                  <SelectItem key={recipient.id} value={recipient.id}>
                    {recipient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              <Trans
                i18nKey="removeMemberTransferHint"
                defaults="Closed polls and past events stay as they are."
              />
            </FieldDescription>
          </Field>
        ) : null}
        <DialogFooter>
          <Button
            variant="destructive"
            loading={pending}
            disabled={!toMemberId}
            onClick={() => onConfirm(toMemberId)}
          >
            <Trans i18nKey="confirm" defaults="Confirm" />
          </Button>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
