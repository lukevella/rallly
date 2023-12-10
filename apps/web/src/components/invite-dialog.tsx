import { Button } from "@rallly/ui/button";
import { useToast } from "@rallly/ui/use-toast";
import { ShareIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useCopyToClipboard } from "react-use";

import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";

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

  function handleCopy() {
    copyToClipboard(`${window.location.origin}/invite/${poll.id}`);
    toast({
      description: t("copiedToClipboard", {
        defaultValue: "Invite link copied to clipboard",
      }),
    });
  }

  return (
    <Button
      icon={ShareIcon}
      onClick={() => {
        handleCopy();
      }}
    >
      <span className="hidden sm:block">
        <Trans i18nKey="share" defaults="Share" />
      </span>
    </Button>
  );
};
