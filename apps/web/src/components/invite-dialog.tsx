import { Button } from "@rallly/ui/button";
import { ShareIcon } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useCopyToClipboard } from "react-use";

import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";

export const InviteDialog = () => {
  const poll = usePoll();
  const { t } = useTranslation();

  const [state, copyToClipboard] = useCopyToClipboard();

  React.useEffect(() => {
    if (state.error) {
      console.error(`Unable to copy value: ${state.error.message}`);
    }
  }, [state]);

  function handleCopy() {
    copyToClipboard(`${window.location.origin}/invite/${poll.id}`);
    toast.success(
      t("copiedToClipboard", {
        defaultValue: "Invite link copied to clipboard",
      }),
    );
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
