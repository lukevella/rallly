"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import { SendIcon } from "lucide-react";
import { Trans } from "@/i18n/client";

export function ContactSupportLink() {
  return (
    <a
      href="mailto:support@rallly.co"
      className={buttonVariants()}
      onClick={() => {
        posthog?.capture("space_billing:support_button_click");
      }}
    >
      <Icon>
        <SendIcon />
      </Icon>
      <Trans i18nKey="contactSupport" defaults="Contact Support" />
    </a>
  );
}
