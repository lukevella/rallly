"use client";

import { toast } from "@rallly/ui/sonner";
import React from "react";
import { useTranslation } from "@/i18n/client";
import { useFlash } from "@/lib/flash/client";
import { OAUTH_FLASH_KEY } from "@/lib/oauth/constants";

// Surfaces the outcome of the OAuth round trip once the user lands back here.
// Consuming the flash here also keeps a calendar outcome from lingering until
// another page that reads the same key picks it up.
export function CalendarConnectionFlash() {
  const { t } = useTranslation();
  const flash = useFlash(OAUTH_FLASH_KEY);

  React.useEffect(() => {
    if (!flash) return;
    if (flash.startsWith("connected:")) {
      toast.success(
        t("calendarConnected", { defaultValue: "Calendar connected" }),
      );
    } else {
      toast.error(
        t("calendarConnectFailed", {
          defaultValue: "We couldn't connect that calendar. Please try again.",
        }),
      );
    }
  }, [flash, t]);

  return null;
}
