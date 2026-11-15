"use client";

import { CircleHelpIcon } from "lucide-react";
import { Trans, useTranslation } from "@/i18n/client";
import { InviteSheet } from "../invite-sheet";

export function InviteHelpSheet({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <InviteSheet
      label={t("inviteNavHelp", { defaultValue: "Help" })}
      icon={<CircleHelpIcon />}
      title={<Trans i18nKey="inviteHelpTitle" defaults="How to vote" />}
      className="sm:max-w-xl"
    >
      <div className="p-4 sm:p-6">{children}</div>
    </InviteSheet>
  );
}
