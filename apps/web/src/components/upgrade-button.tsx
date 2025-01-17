import { usePostHog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import Link from "next/link";
import { Trans } from "next-i18next";
import React from "react";

export const UpgradeButton = ({
  children,
  annual,
  large,
}: React.PropsWithChildren<{ annual?: boolean; large?: boolean }>) => {
  const posthog = usePostHog();
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} method="POST" action="/api/stripe/checkout">
      <input
        type="hidden"
        name="period"
        value={annual ? "yearly" : "monthly"}
      />
      <input
        type="hidden"
        name="return_path"
        value={window.location.pathname}
      />
      <Button
        size={large ? "lg" : "default"}
        className="w-full"
        variant="primary"
        onClick={(e) => {
          // 🐛 Since we have nested forms, we need to prevent the default
          // action of the button from being triggered so that we don't submit
          // the parent form.
          // TODO: Fix this by making sure we never have nested forms.
          e.preventDefault();
          formRef.current?.submit();
          posthog?.capture("click upgrade button");
        }}
      >
        {children || <Trans i18nKey="upgrade" defaults="Upgrade" />}
      </Button>
    </form>
  );
};

export const UpgradeLink = ({}) => {
  return (
    <Button variant="primary" asChild>
      <Link href="/settings/billing">
        <Trans i18nKey="upgrade" defaults="Upgrade" />
      </Link>
    </Button>
  );
};
