"use client";

import { useToast } from "@rallly/ui/hooks/use-toast";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function UnsubscribeAlert() {
  const { toast } = useToast();
  const { t } = useTranslation("app");

  useEffect(() => {
    // check client side cookie for notifications-unsubscribed
    const unsubscribed = Cookies.get("notifications-unsubscribed");
    if (unsubscribed) {
      Cookies.remove("notifications-unsubscribed");
      toast({
        title: t("unsubscribeToastTitle", {
          defaultValue: "You have disabled notifications",
        }),
        description: t("unsubscribeToastDescription", {
          defaultValue:
            "You will no longer receive notifications for this poll",
        }),
      });
    }
  }, [t, toast]);

  return null;
}
