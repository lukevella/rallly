"use client";
import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import type { DisplayedCurrency } from "@rallly/billing";
import { Button } from "@rallly/ui/button";
import { useMutation } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";

import { upgradeToProAction } from "@/features/billing/actions";
import { useUser } from "@/features/user/client";
import { Trans } from "@/i18n/client";

export const UpgradeButton = ({
  children,
  annual,
  currency,
  className,
  onClick,
}: React.PropsWithChildren<{
  annual?: boolean;
  currency?: DisplayedCurrency;
  className?: string;
  onClick?: () => void;
}>) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const upgradeToPro = useMutation(mutationOptions(upgradeToProAction));

  return (
    <Button
      type="button"
      size="xl"
      className={className}
      variant="primary"
      loading={upgradeToPro.isPending}
      onClick={() => {
        onClick?.();
        if (!user || user.isGuest) {
          router.push(`/register?redirectTo=${encodeURIComponent(pathname)}`);
          return;
        }
        upgradeToPro.mutate({
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
