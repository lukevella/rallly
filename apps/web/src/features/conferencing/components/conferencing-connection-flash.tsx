"use client";

import { toast } from "@rallly/ui/sonner";
import React from "react";
import { useCopyToClipboard } from "react-use";
import { useTranslation } from "@/i18n/client";
import { useFlash } from "@/lib/flash/client";
import { OAUTH_FLASH_KEY } from "@/lib/oauth/constants";

// Organizations can require an administrator to approve Teams before their
// users may connect it; this link lets the administrator grant it.
const teamsAdminConsentPath =
  "/api/integrations/admin-consent/microsoft-teams?redirect=/settings/conferencing";

// Surfaces the outcome of the OAuth round trip once the user lands back here.
export function ConferencingConnectionFlash() {
  const { t } = useTranslation();
  const flash = useFlash(OAUTH_FLASH_KEY);
  const [, copy] = useCopyToClipboard();

  React.useEffect(() => {
    if (!flash) return;
    if (flash.startsWith("connected:")) {
      toast.success(
        t("conferencingConnected", { defaultValue: "Account connected" }),
      );
    } else if (flash.startsWith("admin_consent:")) {
      toast.success(
        t("conferencingAdminConsentGranted", {
          defaultValue:
            "Approved. People in your organization can now connect this app.",
        }),
      );
    } else if (flash.startsWith("error:admin_consent_denied:")) {
      toast.error(
        t("conferencingAdminConsentDenied", {
          defaultValue:
            "The app was not approved. People in your organization still can't connect it.",
        }),
      );
    } else if (flash.endsWith(":microsoft-teams")) {
      // A failure here is often the organization's consent policy, which
      // only an administrator can resolve, so the toast stays until closed.
      toast.error(
        t("conferencingConnectFailed", {
          defaultValue: "We couldn't connect that account. Please try again.",
        }),
        {
          description: t("conferencingTeamsAdminConsentHint", {
            defaultValue:
              "If your organization requires admin approval, send this link to your IT administrator.",
          }),
          duration: Number.POSITIVE_INFINITY,
          closeButton: true,
          action: {
            label: t("copyLink", { defaultValue: "Copy link" }),
            onClick: () => {
              copy(new URL(teamsAdminConsentPath, window.location.origin).href);
              toast.success(t("copied", { defaultValue: "Copied" }));
            },
          },
        },
      );
    } else if (flash.startsWith("error:")) {
      toast.error(
        t("conferencingConnectFailed", {
          defaultValue: "We couldn't connect that account. Please try again.",
        }),
      );
    }
  }, [flash, t, copy]);

  return null;
}
