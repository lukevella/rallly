"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import { SendIcon } from "lucide-react";
import { Trans } from "@/i18n/client";

export function ContactSupportLink() {
  return (
    <div className="flex flex-col items-start gap-3">
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
      <p className="text-muted-foreground text-sm">
        <Trans
          i18nKey="contactSupportEmail"
          defaults="Or email us at <0>support@rallly.co</0>"
          components={[
            <a
              key="email"
              href="mailto:support@rallly.co"
              className="select-all font-medium text-foreground"
            />,
          ]}
        />
      </p>
    </div>
  );
}
