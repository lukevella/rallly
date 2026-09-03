"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@rallly/ui/input-group";
import React from "react";
import { useCopyToClipboard } from "react-use";
import { Trans, useTranslation } from "@/i18n/client";

export function InviteLinkField({ inviteLink }: { inviteLink: string }) {
  const { t } = useTranslation();
  const [didCopy, setDidCopy] = React.useState(false);
  const [state, copyToClipboard] = useCopyToClipboard();
  const display = inviteLink.replace(/^https?:\/\//, "");

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
    <InputGroup>
      <InputGroupInput
        readOnly
        value={display}
        aria-label={t("inviteLink", { defaultValue: "Invite link" })}
        onFocus={(event) => event.currentTarget.select()}
        className="font-mono text-xs"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="sm"
          className="min-w-20"
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
        </InputGroupButton>
      </InputGroupAddon>
      <p className="sr-only" aria-live="polite">
        {didCopy
          ? t("inviteLinkCopied", { defaultValue: "Invite link copied" })
          : ""}
      </p>
    </InputGroup>
  );
}
