"use client";

import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import React from "react";
import { usePoll } from "@/features/poll/client";
import { useUser } from "@/features/user/client";
import { Trans } from "@/i18n/client";

/**
 * What an invitee receives, shown as text with the organiser's name and the
 * poll's title filled in. The template itself is fixed (packages/emails,
 * poll-invite): these are its subject, body and button, repeated here so
 * the organiser can read them before the first send.
 */
export function InviteEmailPreview() {
  const poll = usePoll();
  const { user } = useUser();
  const [isOpen, setIsOpen] = React.useState(false);
  const hostName = user?.name ?? "";

  return (
    <div>
      <Button
        variant="link"
        size="sm"
        className="px-0"
        aria-expanded={isOpen}
        aria-controls="invite-email-preview"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? (
          <Trans i18nKey="inviteEmailPreviewHide" defaults="Hide the email" />
        ) : (
          <Trans i18nKey="inviteEmailPreviewShow" defaults="See the email" />
        )}
        {isOpen ? (
          <ChevronUpIcon data-icon="inline-end" />
        ) : (
          <ChevronDownIcon data-icon="inline-end" />
        )}
      </Button>
      {isOpen ? (
        <div
          id="invite-email-preview"
          className="mt-2 space-y-3 rounded-xl border border-card-border bg-card p-4 text-sm"
        >
          <p className="text-muted-foreground text-xs">
            <Trans
              i18nKey="inviteEmailPreviewSubject"
              defaults="Subject: {hostName} invited you to respond to {pollTitle}"
              values={{ hostName, pollTitle: poll.title }}
            />
          </p>
          <p className="font-medium">
            <Trans
              i18nKey="inviteEmailPreviewHeading"
              defaults="You're invited"
            />
          </p>
          <p>
            <Trans
              i18nKey="inviteEmailPreviewBody"
              defaults="<b>{hostName}</b> is finding a time for <b>{pollTitle}</b> and wants to know when you're available."
              values={{ hostName, pollTitle: poll.title }}
              components={{ b: <strong /> }}
            />
          </p>
          {/* A picture of the email's button, not a control: it goes nowhere. */}
          <span
            aria-hidden="true"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            <Trans i18nKey="inviteEmailPreviewButton" defaults="Respond" />
          </span>
          <p className="text-muted-foreground text-xs">
            <Trans
              i18nKey="inviteEmailPreviewNote"
              defaults="This is the email as Rallly sends it. Your name and the poll's title fill it in; the wording cannot be changed. Each person's link is personal to them. With Pro's custom branding, your logo and colour appear on it. <0>Set them up in Settings</0>."
              components={[
                <a
                  key="settings"
                  href="/settings/general"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-foreground"
                />,
              ]}
            />
          </p>
        </div>
      ) : null}
    </div>
  );
}
