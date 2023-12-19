import { Button } from "@rallly/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { useToast } from "@rallly/ui/use-toast";
import { ShareIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useCopyToClipboard } from "react-use";

import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";
import { popCookie } from "@/utils/cookies";

export const InviteDialog = () => {
  const poll = usePoll();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [state, copyToClipboard] = useCopyToClipboard();

  React.useEffect(() => {
    if (state.error) {
      console.error(`Unable to copy value: ${state.error.message}`);
    }
  }, [state]);

  React.useEffect(() => {
    if (popCookie("new-poll")) {
      handleCopy();
    }
  });

  function handleCopy() {
    copyToClipboard(`${window.location.origin}/invite/${poll.id}`);
    toast({
      title: t("copied"),
      description: t("copiedToClipboard", {
        defaultValue: "Invite link copied to clipboard",
      }),
    });
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => {
            handleCopy();
          }}
        >
          <ShareIcon className="h-4 w-4 text-muted-foreground" />
          <span className="hidden sm:inline">
            <Trans i18nKey="share" defaults="Share" />
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent align="center">
        <p>
          <Trans
            i18nKey="shareTooltip"
            defaults="Copy invite link to clipboard"
          />
        </p>
      </TooltipContent>
    </Tooltip>
  );
};
