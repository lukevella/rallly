"use client";

import { toast } from "@rallly/ui/sonner";
import React from "react";
import { useTranslation } from "@/i18n/client";
import { useFlash } from "@/lib/flash/client";
import { OAUTH_FLASH_KEY } from "@/lib/oauth/constants";

// Surfaces the outcome of the OAuth round trip once the user lands back here.
export function ConferencingConnectionFlash() {
  const { t } = useTranslation();
  const flash = useFlash(OAUTH_FLASH_KEY);

  React.useEffect(() => {
    if (!flash) return;
    if (flash.startsWith("connected:")) {
      toast.success(
        t("conferencingConnected", { defaultValue: "Account connected" }),
      );
    } else {
      toast.error(
        t("conferencingConnectFailed", {
          defaultValue: "We couldn't connect that account. Please try again.",
        }),
      );
    }
  }, [flash, t]);

  return null;
}
