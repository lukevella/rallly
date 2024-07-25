"use client";
import { CheckIcon, LinkIcon } from "lucide-react";
import React from "react";
import useCopyToClipboard from "react-use/lib/useCopyToClipboard";

import { Trans } from "@/components/trans";

export function CopyLinkButton({ pollId }: { pollId: string }) {
  const [, copy] = useCopyToClipboard();
  const [didCopy, setDidCopy] = React.useState(false);

  if (didCopy) {
    return (
      <div className="inline-flex items-center gap-x-1.5 text-sm font-medium text-green-600">
        <CheckIcon className="size-4" />
        <Trans i18nKey="copied" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        copy(`${window.location.origin}/invite/${pollId}`);
        setDidCopy(true);
        setTimeout(() => {
          setDidCopy(false);
        }, 1000);
      }}
      className="text-foreground inline-flex items-center gap-x-1.5 text-sm hover:underline"
    >
      <LinkIcon className="size-4" />

      <Trans i18nKey="copyLink" defaults="Copy Link" />
    </button>
  );
}
