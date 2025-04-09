"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useCopyToClipboard } from "react-use";
import { useTranslation } from "@/i18n/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { useState } from "react";

export function CopyLinkButton({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  const [, copy] = useCopyToClipboard();
  const [didCopy, setDidCopy] = useState(false);
  const { t } = useTranslation();
  return (
    <Tooltip open={didCopy ? true : undefined}>
      <TooltipTrigger asChild>
        <Button
          className={className}
          variant="ghost"
          size="icon"
          onClick={() => {
            copy(href);
            setDidCopy(true);
            setTimeout(() => setDidCopy(false), 1000);
          }}
        >
          <Icon>
            <CopyIcon />
          </Icon>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {didCopy ? (
          <div className="flex items-center gap-2">
            <CheckIcon className="size-4 text-green-400" />
            {t("copied", { defaultValue: "Copied" })}
          </div>
        ) : (
          <p>{t("copyLink", { defaultValue: "Copy link" })}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
