"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { ClockIcon } from "lucide-react";

import { Trans } from "@/components/trans";
import { usePreferences } from "@/contexts/preferences";
import { useDayjs } from "@/utils/dayjs";

export function TimeFormatControl() {
  const { timeFormat } = useDayjs();
  const { updatePreferences } = usePreferences();

  return (
    <Button
      variant="ghost"
      onClick={() => {
        if (timeFormat === "hours12") {
          updatePreferences({ timeFormat: "hours24" });
        } else {
          updatePreferences({ timeFormat: "hours12" });
        }
      }}
    >
      <Icon>
        <ClockIcon />
      </Icon>
      {timeFormat === "hours12" ? (
        <Trans i18nKey="12h" />
      ) : (
        <Trans i18nKey="24h" />
      )}
    </Button>
  );
}
