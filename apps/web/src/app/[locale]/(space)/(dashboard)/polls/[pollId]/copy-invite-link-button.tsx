"use client";

import { Button } from "@rallly/ui/button";
import { CheckIcon, LinkIcon } from "lucide-react";
import * as React from "react";
import { useCopyToClipboard } from "react-use";
import { Trans } from "@/i18n/client";

export function CopyInviteLinkButton({ inviteUrl }: { inviteUrl: string }) {
  const [, copyToClipboard] = useCopyToClipboard();
  const [didCopy, setDidCopy] = React.useState(false);

  return (
    <Button
      variant="primary"
      onClick={() => {
        copyToClipboard(inviteUrl);
        setDidCopy(true);
        setTimeout(() => {
          setDidCopy(false);
        }, 1000);
      }}
    >
      {didCopy ? (
        <>
          <CheckIcon data-icon="inline-start" />
          <Trans i18nKey="copied" defaults="Copied" />
        </>
      ) : (
        <>
          <LinkIcon data-icon="inline-start" />
          <Trans i18nKey="copyInviteLink" defaults="Copy invite link" />
        </>
      )}
    </Button>
  );
}
