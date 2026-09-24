"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { yearlySavingsPercent } from "@rallly/billing";
import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { switchToYearlyAction } from "@/features/billing/actions";
import { Trans } from "@/i18n/client";

export function SwitchToYearlyDialog({
  children,
  monthlyAmount,
  yearlyAmount,
  ...dialogProps
}: DialogProps & {
  /** Per seat monthly amount in the currency's minor unit. */
  monthlyAmount: number;
  /** Per seat yearly amount in the currency's minor unit. */
  yearlyAmount: number;
}) {
  const switchToYearly = useMutation(mutationOptions(switchToYearlyAction));

  return (
    <Dialog {...dialogProps}>
      {children}
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            <Trans
              i18nKey="switchToYearlyTitle"
              defaults="Switch to yearly billing"
            />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="switchToYearlyDescription"
              defaults="Save {percent}% when you pay yearly."
              values={{
                percent: yearlySavingsPercent({
                  monthly: monthlyAmount,
                  yearly: yearlyAmount,
                }),
              }}
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
          <Button
            variant="primary"
            loading={switchToYearly.isPending}
            onClick={() => switchToYearly.mutate()}
          >
            <Trans i18nKey="switchToYearly" defaults="Switch to yearly" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
