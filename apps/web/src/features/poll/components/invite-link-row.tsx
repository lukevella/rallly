"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { CheckIcon, CopyIcon, LinkIcon } from "lucide-react";
import React from "react";
import { useCopyToClipboard } from "react-use";
import { usePoll } from "@/features/poll/client";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * The invite link with its copy action. The URL is shown because hosts have
 * learned to look for something that looks like a link.
 */
export function InviteLinkRow({ inviteLink }: { inviteLink: string }) {
  const poll = usePoll();
  const { t } = useTranslation();
  const [didCopy, setDidCopy] = React.useState(false);
  const [state, copyToClipboard] = useCopyToClipboard();

  // react-use records a failed copy as `error` and a successful one as
  // `value`; the button only claims success in the second case.
  React.useEffect(() => {
    if (state.error) {
      console.error(`Unable to copy value: ${state.error.message}`);
      return;
    }
    if (state.value) {
      setDidCopy(true);
      posthog?.capture("poll_share:invite_link_copy", { poll_id: poll.id });
    }
  }, [state, poll.id]);

  React.useEffect(() => {
    if (!didCopy) return;
    const timer = setTimeout(() => setDidCopy(false), 1500);
    return () => clearTimeout(timer);
  }, [didCopy]);

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-card-border bg-card p-3">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-lg border border-card-border bg-card text-muted-foreground"
      >
        <LinkIcon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">
          <Trans i18nKey="inviteLink" defaults="Invite link" />
        </p>
        <p className="truncate text-muted-foreground text-xs">{inviteLink}</p>
      </div>
      <Button
        variant="ghost"
        className="shrink-0 text-primary"
        onClick={() => copyToClipboard(inviteLink)}
      >
        {didCopy ? (
          <CheckIcon data-icon="inline-start" />
        ) : (
          <CopyIcon data-icon="inline-start" />
        )}
        {didCopy ? (
          <Trans i18nKey="copied" defaults="Copied" />
        ) : (
          <Trans i18nKey="copy" defaults="Copy" />
        )}
      </Button>
      <p className="sr-only" aria-live="polite">
        {didCopy
          ? t("inviteLinkCopied", { defaultValue: "Invite link copied" })
          : ""}
      </p>
    </div>
  );
}
