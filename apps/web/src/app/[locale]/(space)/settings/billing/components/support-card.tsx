"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants } from "@rallly/ui";
import { SendIcon } from "lucide-react";
import { Trans } from "@/i18n/client";
import {
  PlanCard,
  PlanCardHeading,
  PlanCardHeadingDescription,
  PlanCardHeadingTitle,
} from "./plan-card";

export function SupportCard({ className }: { className?: string }) {
  return (
    <PlanCard className={className}>
      <PlanCardHeading>
        <PlanCardHeadingTitle>
          <Trans i18nKey="support" defaults="Support" />
        </PlanCardHeadingTitle>
        <PlanCardHeadingDescription>
          <Trans
            i18nKey="supportDescription"
            defaults="Need help with anything?"
          />
        </PlanCardHeadingDescription>
      </PlanCardHeading>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-3 pb-4">
        <a
          href="mailto:support@rallly.co"
          className={buttonVariants()}
          onClick={() => {
            posthog?.capture("space_billing:support_button_click");
          }}
        >
          <SendIcon className="text-muted-foreground" />
          <Trans i18nKey="contactSupport" defaults="Contact support" />
        </a>
        <p className="ml-auto text-muted-foreground text-sm">
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
    </PlanCard>
  );
}
