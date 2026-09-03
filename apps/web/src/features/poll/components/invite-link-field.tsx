"use client";

import { Button } from "@rallly/ui/button";
import { Input } from "@rallly/ui/input";
import { CheckIcon, CopyIcon } from "lucide-react";
import React from "react";
import { useCopyToClipboard } from "react-use";
import { Trans, useTranslation } from "@/i18n/client";

export function InviteLinkField({ inviteLink }: { inviteLink: string }) {
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
    <div className="flex gap-2">
      <Input
        readOnly
        value={inviteLink}
        aria-label={t("inviteLink", { defaultValue: "Invite link" })}
        onFocus={(event) => event.currentTarget.select()}
        className="min-w-0 flex-1"
      />
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
