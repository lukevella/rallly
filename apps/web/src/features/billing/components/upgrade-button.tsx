"use client";
import { Button } from "@rallly/ui/button";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";

import { upgradeToProAction } from "@/features/billing/actions";
import { useUser } from "@/features/user/components/user-provider";
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
  const router = useRouter();
  const { user } = useUser();
  const upgradeToPro = useSafeAction(upgradeToProAction);

  return (
    <Button
      type="button"
      size="xl"
      className={className}
      variant="primary"
      loading={upgradeToPro.isExecuting}
      onClick={() => {
        if (!user || user.isGuest) {
          router.push(`/register?redirectTo=${encodeURIComponent(pathname)}`);
          return;
        }
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
