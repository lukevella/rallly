import clsx from "clsx";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import toast from "react-hot-toast";
import { useCopyToClipboard } from "react-use";

import { Button } from "./button";
import { usePoll } from "./poll-context";

export interface SharingProps {
  className?: string;
}

const Sharing: React.VoidFunctionComponent<SharingProps> = ({ className }) => {
  const { poll } = usePoll();
  const { t } = useTranslation("app");
  const [state, copyToClipboard] = useCopyToClipboard();

  React.useEffect(() => {
    if (state.error) {
      toast.error(`Unable to copy value: ${state.error.message}`);
    }
  }, [state]);

  const participantUrl = `${window.location.origin}/p/${poll.participantUrlId}`;
  const [didCopy, setDidCopy] = React.useState(false);
  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-800">
          {t("shareLink")}
        </div>
      </div>
      <div className="mb-4 text-slate-600">
        <Trans
          t={t}
          i18nKey="shareDescription"
          components={{ b: <strong /> }}
        />
      </div>
      <div className="relative">
        <input
          readOnly={true}
          className={clsx(
            "mb-4 w-full rounded-md border p-2 transition-all md:mb-0 md:p-3 md:text-lg",
            {
              "bg-gray-100/50": !didCopy,
              "bg-gray-100": didCopy,
            },
          )}
          value={participantUrl}
        />
        <Button
          disabled={didCopy}
          type="primary"
          onClick={() => {
            copyToClipboard(participantUrl);
            setDidCopy(true);
            setTimeout(() => {
              setDidCopy(false);
            }, 1000);
          }}
          className="md:absolute md:top-1/2 md:right-2 md:-translate-y-1/2"
        >
          {didCopy ? t("copied") : t("copyLink")}
        </Button>
      </div>
    </div>
  );
};

export default Sharing;
