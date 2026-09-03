"use client";

import { Button } from "@rallly/ui/button";
import { CheckIcon, CopyIcon, LinkIcon } from "lucide-react";
import React from "react";
import { useCopyToClipboard } from "react-use";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * The invite link with its copy action. The URL is shown because hosts have
 * learned to look for something that looks like a link.
 */
export function InviteLinkRow({ inviteLink }: { inviteLink: string }) {
  const { t } = useTranslation();
  const [didCopy, setDidCopy] = React.useState(false);
  const [state, copyToClipboard] = useCopyToClipboard();

  React.useEffect(() => {
    if (state.error) {
      console.error(`Unable to copy value: ${state.error.message}`);
    }
  }, [state]);

  React.useEffect(() => {
    if (!didCopy) return;
    const timer = setTimeout(() => setDidCopy(false), 1500);
    return () => clearTimeout(timer);
  }, [didCopy]);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary"
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
        className="shrink-0"
        onClick={() => {
          copyToClipboard(inviteLink);
          setDidCopy(true);
        }}
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
