"use client";

import { toast } from "@rallly/ui/sonner";
import Cookies from "js-cookie";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "@/i18n/client";

export function UnsubscribeAlert() {
  const { t } = useTranslation();

  const urlId = useParams<{ urlId: string }>()?.urlId;

  useEffect(() => {
    if (!urlId) return;
    const cookieName = `notifications-unsubscribed-${urlId}`;
    const unsubscribed = Cookies.get(cookieName);
    if (unsubscribed) {
      Cookies.remove(cookieName);
      toast.message(
        t("unsubscribeToastTitle", {
          defaultValue: "You have disabled notifications",
        }),
        {
          description: t("unsubscribeToastDescription", {
            defaultValue:
              "You will no longer receive notifications for this poll",
          }),
        },
      );
    }
  }, [t, urlId]);

  return null;
}
