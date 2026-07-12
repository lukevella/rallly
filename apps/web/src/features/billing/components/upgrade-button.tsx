"use client";
import { Button } from "@rallly/ui/button";
import { usePathname } from "next/navigation";
import type React from "react";

import { upgradeToProAction } from "@/features/billing/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export const UpgradeButton = ({
  children,
  annual,
  className,
}: React.PropsWithChildren<{
  annual?: boolean;
  className?: string;
}>) => {
  const pathname = usePathname();
  const upgradeToPro = useSafeAction(upgradeToProAction);

  return (
    <Button
      type="button"
      size="xl"
      className={className}
      variant="primary"
      loading={upgradeToPro.isExecuting}
      onClick={() => {
        upgradeToPro.execute({
          period: annual ? "yearly" : "monthly",
          returnPath: pathname,
        });
      }}
    >
      {children || <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />}
    </Button>
  );
};
