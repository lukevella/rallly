import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";
import toast from "react-hot-toast";
import { useCopyToClipboard } from "react-use";

import ManagePoll from "@/components/poll/manage-poll";
import NotificationsToggle from "@/components/poll/notifications-toggle";

import { Button } from "./button";
import { usePoll } from "./poll-context";

const Sharing: React.FunctionComponent = () => {
  const { poll } = usePoll();
  const { t } = useTranslation();
  const [state, copyToClipboard] = useCopyToClipboard();

  React.useEffect(() => {
    if (state.error) {
      toast.error(`Unable to copy value: ${state.error.message}`);
    }
  }, [state]);

  const participantUrl = `${window.location.origin}/p/${poll.participantUrlId}`;
  const [didCopy, setDidCopy] = React.useState(false);
  return (
    <div className="flex flex-col gap-3 md:flex-row">
      <div className="flex items-center justify-between">
        <div className="px-2 font-semibold tracking-tight">
          {t("shareLink")}
        </div>
      </div>
      <div className="grow">
        <input
          readOnly={true}
          className={clsx(
            "w-full rounded bg-gray-100 p-2 tracking-tight text-gray-600 transition-colors md:mb-0",
            {
              "bg-gray-100 opacity-75": didCopy,
            },
          )}
          value={participantUrl}
        />
      </div>
      <div className="flex gap-2">
        <Button
          disabled={didCopy}
          onClick={() => {
            copyToClipboard(participantUrl);
            setDidCopy(true);
            setTimeout(() => {
              setDidCopy(false);
            }, 1000);
          }}
          className=""
        >
          {didCopy ? t("copied") : t("copyLink")}
        </Button>
        <NotificationsToggle />
        <ManagePoll placement="bottom-end" />
      </div>
    </div>
  );
};

export default Sharing;
