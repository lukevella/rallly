"use client";

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
import { changeBillingIntervalAction } from "@/features/billing/actions";
import type { BillingInterval } from "@/features/billing/schema";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function ChangePlanDialog({
  children,
  interval,
  price,
  perMonth,
  listPrice,
  ...dialogProps
}: DialogProps & {
  /** The interval the subscriber would move to. */
  interval: BillingInterval;
  /** Formatted total for the new interval, e.g. "$56". */
  price: string;
  /** Formatted per month equivalent when the new interval is yearly. */
  perMonth?: string;
  /** Formatted list price for the new interval; set only when it differs. */
  listPrice?: string;
}) {
  const changeInterval = useSafeAction(changeBillingIntervalAction);

  return (
    <Dialog {...dialogProps}>
      {children}
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            {interval === "year" ? (
              <Trans
                i18nKey="changePlanToYearlyTitle"
                defaults="Switch to yearly billing"
              />
            ) : (
              <Trans
                i18nKey="changePlanToMonthlyTitle"
                defaults="Switch to monthly billing"
              />
            )}
          </DialogTitle>
          <DialogDescription>
            {interval === "year" ? (
              <Trans
                i18nKey="changePlanToYearlyDescription"
                defaults="You'll pay {price} per year, which works out to {perMonth} per month."
                values={{ price, perMonth: perMonth ?? price }}
              />
            ) : (
              <Trans
                i18nKey="changePlanToMonthlyDescription"
                defaults="You'll pay {price} per month."
                values={{ price }}
              />
            )}
          </DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          {listPrice ? (
            <Trans
              i18nKey="changePlanEarlySupporterNote"
              defaults="You keep your early supporter rate. New subscribers pay {listPrice} per {interval, select, month {month} other {year}}."
              values={{ listPrice, interval }}
            />
          ) : (
            <Trans
              i18nKey="changePlanProrationNote"
              defaults="The change takes effect now. Stripe shows the prorated amount before you confirm."
            />
          )}
        </p>
        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
          <Button
            variant="primary"
            loading={changeInterval.isExecuting}
            onClick={() => changeInterval.execute({ interval })}
          >
            <Trans i18nKey="continue" defaults="Continue" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
