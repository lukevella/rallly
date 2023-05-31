import { LinkIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import React from "react";
import { useCopyToClipboard } from "react-use";

import Tooltip from "@/components/tooltip";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";

export const CopyLinkButton = () => {
  const poll = usePoll();

  const [state, copyToClipboard] = useCopyToClipboard();

  React.useEffect(() => {
    if (state.error) {
      console.error(`Unable to copy value: ${state.error.message}`);
    }
  }, [state]);

  const inviteLink = `${window.location.origin}/invite/${poll?.id}`;
  const [didCopy, setDidCopy] = React.useState(false);

  return (
    <Button
      disabled={didCopy}
      onClick={() => {
        copyToClipboard(inviteLink);
        setDidCopy(true);
        setTimeout(() => {
          setDidCopy(false);
        }, 1000);
      }}
    >
      {didCopy ? (
        <Trans i18nKey="copied" />
      ) : (
        <Trans i18nKey="copyLink" defaults="Copy Link" />
      )}
    </Button>
  );
};
