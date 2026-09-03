"use client";

import { Button } from "@rallly/ui/button";
import { CheckIcon, CopyIcon, GlobeIcon } from "lucide-react";
import React from "react";
import { useCopyToClipboard } from "react-use";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * Footer row describing who the invite link admits, with the copy action.
 * The URL itself is never shown; copying is the only thing hosts do with it.
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
    <div className="flex items-center gap-3 px-1 py-2">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"
      >
        <GlobeIcon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">
          <Trans
            i18nKey="shareDialogAnyoneWithLink"
            defaults="Anyone with the link"
          />
        </p>
        <p className="text-muted-foreground text-sm">
          <Trans i18nKey="shareDialogCanRespond" defaults="Can respond" />
        </p>
      </div>
      <Button
        variant="ghost"
        className="shrink-0 text-primary"
        onClick={() => {
          copyToClipboard(inviteLink);
          setDidCopy(true);
        }}
      >
        {didCopy ? (
          <Trans i18nKey="copied" defaults="Copied" />
        ) : (
          <Trans i18nKey="copyLink" defaults="Copy link" />
        )}
        {didCopy ? (
          <CheckIcon data-icon="inline-end" />
        ) : (
          <CopyIcon data-icon="inline-end" />
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
