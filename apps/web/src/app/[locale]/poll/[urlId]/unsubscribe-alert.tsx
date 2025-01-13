"use client";

import { useToast } from "@rallly/ui/hooks/use-toast";
import Cookies from "js-cookie";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function UnsubscribeAlert() {
  const { toast } = useToast();
  const { t } = useTranslation("app");

  const urlId = useParams<{ urlId: string }>()?.urlId;

  useEffect(() => {
    if (!urlId) return;
    const cookieName = `notifications-unsubscribed-${urlId}`;
    const unsubscribed = Cookies.get(cookieName);
    if (unsubscribed) {
      Cookies.remove(cookieName);
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
  }, [t, toast, urlId]);

  return null;
}
