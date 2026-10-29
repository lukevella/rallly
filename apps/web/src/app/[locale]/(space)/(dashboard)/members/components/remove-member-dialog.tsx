"use client";

import { Alert, AlertDescription } from "@rallly/ui/alert";
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@rallly/ui/field";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { VideoOffIcon } from "lucide-react";
import React from "react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import type { MemberContentSummary } from "@/features/space/member/types";
import { Trans, useTranslation } from "@/i18n/client";

export type RemovalRecipient = {
  id: string;
  name: string;
  image?: string;
  isActor: boolean;
};

export type RemovedMemberContent = { reassignTo: string } | { delete: true };

function hasActiveContent(summary: MemberContentSummary) {
  const { polls, events, eventTypes, sheets } = summary.active;
  return polls + events + eventTypes + sheets > 0;
}

function hasAnyContent(summary: MemberContentSummary) {
  return (
    hasActiveContent(summary) ||
    summary.finished.polls + summary.finished.events > 0
  );
}

function RecipientLabel({ recipient }: { recipient: RemovalRecipient }) {
  return (
    <span className="flex items-center gap-2">
      <OptimizedAvatarImage
        src={recipient.image}
        name={recipient.name}
        size="sm"
      />
      <span className="truncate">{recipient.name}</span>
    </span>
  );
}

function ContentGroup({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-medium text-sm">{title}</h3>
      <ul className="mt-1 text-muted-foreground text-sm">{children}</ul>
    </div>
  );
}

function ContentSummary({ summary }: { summary: MemberContentSummary }) {
  const { active, finished } = summary;

  return (
    <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
      <ContentGroup
        title={<Trans i18nKey="removeMemberActive" defaults="Active" />}
      >
        {hasActiveContent(summary) ? (
          <>
            {active.polls > 0 ? (
              <li>
                <Trans
                  i18nKey="removeMemberOpenPolls"
                  defaults="{count, plural, one {# open poll} other {# open polls}}"
                  values={{ count: active.polls }}
                />
              </li>
            ) : null}
            {active.events > 0 ? (
              <li>
                <Trans
                  i18nKey="removeMemberUpcomingEvents"
                  defaults="{count, plural, one {# upcoming event} other {# upcoming events}}"
                  values={{ count: active.events }}
                />
              </li>
            ) : null}
            {active.eventTypes > 0 ? (
              <li>
                <Trans
                  i18nKey="removeMemberEventTypes"
                  defaults="{count, plural, one {# event type} other {# event types}}"
                  values={{ count: active.eventTypes }}
                />
              </li>
            ) : null}
            {active.sheets > 0 ? (
              <li>
                <Trans
                  i18nKey="removeMemberSheets"
                  defaults="{count, plural, one {# sheet} other {# sheets}}"
                  values={{ count: active.sheets }}
                />
              </li>
            ) : null}
          </>
        ) : (
          <li>
            <Trans
              i18nKey="removeMemberNoActiveContent"
              defaults="No open polls or upcoming events"
            />
          </li>
        )}
      </ContentGroup>
      <ContentGroup
        title={<Trans i18nKey="removeMemberFinished" defaults="Finished" />}
      >
        {finished.polls + finished.events > 0 ? (
          <>
            {finished.polls > 0 ? (
              <li>
                <Trans
                  i18nKey="removeMemberClosedPolls"
                  defaults="{count, plural, one {# closed poll} other {# closed polls}}"
                  values={{ count: finished.polls }}
                />
              </li>
            ) : null}
            {finished.events > 0 ? (
              <li>
                <Trans
                  i18nKey="removeMemberPastEvents"
                  defaults="{count, plural, one {# past event} other {# past events}}"
                  values={{ count: finished.events }}
                />
              </li>
            ) : null}
          </>
        ) : (
          <li>
            <Trans
              i18nKey="removeMemberNoFinishedContent"
              defaults="No closed polls or past events"
            />
          </li>
        )}
      </ContentGroup>
    </div>
  );
}

function OutcomeOption({
  value,
  title,
  description,
}: {
  value: "reassign" | "delete";
  title: React.ReactNode;
  description: React.ReactNode;
}) {
  const id = `remove-member-outcome-${value}`;
  return (
    <FieldLabel htmlFor={id}>
      <Field orientation="horizontal">
        <RadioGroupItem
          value={value}
          id={id}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-description`}
        />
        <FieldContent>
          <FieldTitle id={`${id}-title`}>{title}</FieldTitle>
          <FieldDescription id={`${id}-description`}>
            {description}
          </FieldDescription>
        </FieldContent>
      </Field>
    </FieldLabel>
  );
}

export function RemoveMemberDialog({
  memberName,
  summary,
  recipients,
  pending,
  onConfirm,
  ...dialogProps
}: {
  memberName: string;
  summary: MemberContentSummary;
  // Current, effective members other than the one leaving.
  recipients: RemovalRecipient[];
  pending: boolean;
  onConfirm: (content: RemovedMemberContent) => void;
} & Pick<React.ComponentProps<typeof Dialog>, "open" | "onOpenChange">) {
  const { t } = useTranslation();
  const defaultRecipientId =
    recipients.find((recipient) => recipient.isActor)?.id ??
    recipients[0]?.id ??
    "";
  const canReassign = recipients.length > 0;
  const [outcome, setOutcome] = React.useState<"reassign" | "delete">(
    hasActiveContent(summary) && canReassign ? "reassign" : "delete",
  );
  const [recipientId, setRecipientId] = React.useState(defaultRecipientId);

  if (!hasAnyContent(summary)) {
    return (
      <Dialog {...dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="removeMember" defaults="Remove member" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="removeMemberConfirmation"
                defaults="Are you sure you want to remove this member?"
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              loading={pending}
              onClick={() => onConfirm({ delete: true })}
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

  const reassigning = outcome === "reassign";

  return (
    <Dialog {...dialogProps}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="removeMember" defaults="Remove member" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="removeMemberContentDescription"
              defaults="{name} will lose access to this space. Choose what happens to everything they created here."
              values={{ name: memberName }}
            />
          </DialogDescription>
        </DialogHeader>
        <ContentSummary summary={summary} />
        <RadioGroup
          aria-label={t("removeMemberOutcome", {
            defaultValue: "What happens to their content",
          })}
          value={outcome}
          onValueChange={(value) => {
            if (value === "reassign" || value === "delete") {
              setOutcome(value);
            }
          }}
        >
          {canReassign ? (
            <OutcomeOption
              value="reassign"
              title={
                <Trans i18nKey="removeMemberReassign" defaults="Reassign" />
              }
              description={
                <Trans
                  i18nKey="removeMemberReassignDescription"
                  defaults="Everything listed moves to another member, who becomes its organizer."
                />
              }
            />
          ) : null}
          <OutcomeOption
            value="delete"
            title={<Trans i18nKey="removeMemberDelete" defaults="Delete" />}
            description={
              summary.active.events > 0 ? (
                <Trans
                  i18nKey="removeMemberDeleteWithEventsDescription"
                  defaults="Everything listed is deleted. Attendees of upcoming events are told they are canceled."
                />
              ) : (
                <Trans
                  i18nKey="removeMemberDeleteDescription"
                  defaults="Everything listed is deleted."
                />
              )
            }
          />
        </RadioGroup>
        {reassigning ? (
          <Field>
            <FieldLabel htmlFor="remove-member-reassign-to">
              <Trans i18nKey="removeMemberReassignTo" defaults="Reassign to" />
            </FieldLabel>
            <Select
              items={Object.fromEntries(
                recipients.map((recipient) => [
                  recipient.id,
                  <RecipientLabel key={recipient.id} recipient={recipient} />,
                ]),
              )}
              value={recipientId}
              onValueChange={(value) => {
                if (value) {
                  setRecipientId(value);
                }
              }}
            >
              <SelectTrigger id="remove-member-reassign-to" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((recipient) => (
                  <SelectItem key={recipient.id} value={recipient.id}>
                    <RecipientLabel recipient={recipient} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
        {reassigning && summary.activeEventsWithVideoCall > 0 ? (
          <Alert variant="warning">
            <VideoOffIcon />
            <AlertDescription>
              <Trans
                i18nKey="removeMemberVideoCallWarning"
                defaults="Video call links created by {name} may stop working."
                values={{ name: memberName }}
              />
            </AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <Button
            variant={reassigning ? "primary" : "destructive"}
            loading={pending}
            disabled={reassigning && !recipientId}
            onClick={() =>
              onConfirm(
                reassigning ? { reassignTo: recipientId } : { delete: true },
              )
            }
          >
            <Trans i18nKey="removeMember" defaults="Remove member" />
          </Button>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
