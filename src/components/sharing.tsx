import { Link } from "@prisma/client";
import clsx from "clsx";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import toast from "react-hot-toast";
import { useCopyToClipboard } from "react-use";

import { Button } from "./button";

export interface SharingProps {
  links: Link[];
  onHide: () => void;
  className?: string;
}

const Sharing: React.VoidFunctionComponent<SharingProps> = ({
  links,
  onHide,
  className,
}) => {
  const { t } = useTranslation("app");
  const [state, copyToClipboard] = useCopyToClipboard();

  React.useEffect(() => {
    if (state.error) {
      toast.error(`Unable to copy value: ${state.error.message}`);
    }
  }, [state]);

  const link = links.find((link) => link.role === "participant");
  if (!link) {
    throw new Error("Missing participant link");
  }
  const pollUrl = `${window.location.origin}/p/${link.urlId}`;
  const [didCopy, setDidCopy] = React.useState(false);
  return (
    <div className={clsx("card p-4", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-700">
          Share via link
        </div>
        <button
          onClick={onHide}
          className="h-8 items-center justify-center rounded-md px-3 text-slate-400 transition-colors hover:bg-slate-500/10 hover:text-slate-500 active:bg-slate-500/20"
        >
          Hide
        </button>
      </div>
      <p className="text-slate-500 lg:text-lg">
        <Trans
          t={t}
          i18nKey="shareDescription"
          components={{ b: <strong /> }}
        />
      </p>
      <div className="relative">
        <input
          readOnly={true}
          className={clsx(
            "mb-4 w-full rounded-md border bg-white p-3 font-mono text-primary-500 transition-all md:mb-0 md:text-xl",
            {
              "bg-slate-50 opacity-75": didCopy,
            },
          )}
          value={pollUrl}
        />
        <Button
          disabled={didCopy}
          onClick={() => {
            copyToClipboard(pollUrl);
            setDidCopy(true);
            setTimeout(() => {
              setDidCopy(false);
            }, 1000);
          }}
          className="md:absolute md:top-1/2 md:right-3 md:-translate-y-1/2"
        >
          {didCopy ? "Copied" : "Copy Link"}
        </Button>
      </div>
    </div>
  );
};

export default Sharing;
