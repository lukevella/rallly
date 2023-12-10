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

  const inviteUrl = React.useMemo(() => {
    // Remove protocol
    const url = new URL(poll.inviteLink);
    return url.host + url.pathname;
  }, [poll.inviteLink]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => {
            handleCopy();
          }}
        >
          <ShareIcon className="h-4 w-4" />
          <span className="hidden sm:block">{inviteUrl}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent align="center">
        <Trans
          i18nKey="shareTooltip"
          defaults="Copy the invite link to your clipboard"
        />
      </TooltipContent>
    </Tooltip>
  );
};
