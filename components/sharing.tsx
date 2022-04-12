import { Link, Role } from "@prisma/client";
import clsx from "clsx";
import { useTranslation } from "next-i18next";
import { usePlausible } from "next-plausible";
import * as React from "react";
import toast from "react-hot-toast";
import { useCopyToClipboard } from "react-use";
import Button from "./button";

export interface SharingProps {
  links: Link[];
}

const useRoleData = (): Record<
  Role,
  { path: string; label: string; description: string }
> => {
  const { t } = useTranslation("app");
  return {
    admin: {
      path: "admin",
      label: t("admin"),
      description: t("adminDescription"),
    },
    participant: {
      path: "p",
      label: t("participant"),
      description: t("participantDescription"),
    },
  };
};

const Sharing: React.VoidFunctionComponent<SharingProps> = ({ links }) => {
  const [state, copyToClipboard] = useCopyToClipboard();

  const plausible = usePlausible();

  React.useEffect(() => {
    if (state.error) {
      toast.error(`Unable to copy value: ${state.error.message}`);
    }
  }, [state]);

  const [role, setRole] = React.useState<Role>("participant");
  const link = links.find((link) => link.role === role);
  if (!link) {
    throw new Error(`Missing link for role: ${role}`);
  }
  const roleData = useRoleData();
  const { path } = roleData[link.role];
  const pollUrl = `${window.location.origin}/${path}/${link.urlId}`;
  const [didCopy, setDidCopy] = React.useState(false);
  return (
    <div className="w-[300px] md:w-[400px]">
      <div className="segment-button inline-flex mb-3">
        <button
          className={clsx({
            "segment-button-active": role === "participant",
          })}
          onClick={() => {
            setRole("participant");
          }}
          type="button"
        >
          {roleData["participant"].label}
        </button>
        <button
          className={clsx({
            "segment-button-active": role === "admin",
          })}
          onClick={() => {
            setRole("admin");
          }}
          type="button"
        >
          {roleData["admin"].label}
        </button>
      </div>
      <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-3 mb-2">
        <input readOnly={true} className="input lg:w-[280px]" value={pollUrl} />
        <Button
          className="shrink-0 w-24"
          disabled={didCopy}
          onClick={() => {
            copyToClipboard(pollUrl);
            setDidCopy(true);
            setTimeout(() => setDidCopy(false), 1000);
            plausible("Copied share link", {
              props: {
                role,
              },
            });
          }}
        >
          {didCopy ? "Copied" : "Copy Link"}
        </Button>
      </div>
      <div className="text-slate-500">{roleData[link.role].description}</div>
    </div>
  );
};

export default Sharing;
