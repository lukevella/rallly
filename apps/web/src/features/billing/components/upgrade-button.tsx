"use client";
import type { DisplayedCurrency } from "@rallly/billing";
import type { ButtonProps } from "@rallly/ui/button";
import { Button } from "@rallly/ui/button";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";

import { upgradeToProAction } from "@/features/billing/actions";
import { useUser } from "@/features/user/client";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export const UpgradeButton = ({
  children,
  annual,
  currency,
  className,
  size = "xl",
  variant = "primary",
  onClick,
}: React.PropsWithChildren<{
  annual?: boolean;
  currency?: DisplayedCurrency;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  onClick?: () => void;
}>) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const upgradeToPro = useSafeAction(upgradeToProAction);

  return (
    <Button
      type="button"
      size={size}
      className={className}
      variant={variant}
      loading={upgradeToPro.isExecuting}
      onClick={() => {
        onClick?.();
        if (!user || user.isGuest) {
          router.push(`/register?redirectTo=${encodeURIComponent(pathname)}`);
          return;
        }
        upgradeToPro.execute({
          period: annual ? "yearly" : "monthly",
          currency,
          returnPath: pathname,
        });
      }}
    >
      {children || <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />}
    </Button>
  );
};
