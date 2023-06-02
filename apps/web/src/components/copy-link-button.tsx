import { Button } from "@rallly/ui/button";
import React from "react";
import { useCopyToClipboard } from "react-use";

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
      className="w-full"
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
        <span className="min-w-0 truncate">{inviteLink}</span>
      )}
    </Button>
  );
};
