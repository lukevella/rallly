import { CheckIcon } from "@rallly/icons";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { Label } from "@rallly/ui/label";
import { Switch } from "@rallly/ui/switch";
import Link from "next/link";
import React from "react";

import { Trans } from "@/components/trans";
import { linkToApp } from "@/lib/linkToApp";

const monthlyPriceUsd = 5;
const annualPriceUsd = 30;

export const BillingPlans = () => {
  const [isBilledAnnually, setBilledAnnually] = React.useState(true);

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-2.5 p-4">
        <Switch
          id="annual-switch"
          checked={isBilledAnnually}
          onCheckedChange={(checked) => {
            setBilledAnnually(checked);
          }}
        />
        <Label htmlFor="annual-switch">
          <Trans
            i18nKey="annualBilling"
            defaults="Annual billing (Save {discount}%)"
            values={{
              discount: Math.round(100 - (annualPriceUsd / 12 / 5) * 100),
            }}
          />
        </Label>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col divide-y">
          <div className="p-4">
            <div className="mb-4 flex items-center gap-x-4">
              <Badge variant="secondary">
                <Trans i18nKey="planFree" defaults="Free" />
              </Badge>
            </div>
            <div>
              <span className="text-3xl font-bold">$0</span>
              <div className="text-muted-foreground text-sm">
                <Trans i18nKey="freeForever" defaults="free forever" />
              </div>
            </div>
          </div>
          <div className="flex grow flex-col p-4">
            <ul className="text-muted-foreground grow text-sm">
              <Perk>
                <Trans
                  i18nKey="plan_unlimitedPolls"
                  defaults="Unlimited polls"
                />
              </Perk>
              <Perk>
                <Trans
                  i18nKey="plan_unlimitedParticipants"
                  defaults="Unlimited participants"
                />
              </Perk>
            </ul>
          </div>
        </Card>
        <ProPlan annual={isBilledAnnually}>
          <Button className="mt-4 w-full" variant="primary" asChild>
            <Link href={linkToApp("/settings/billing")}>
              <Trans i18nKey="upgrade">Upgrade</Trans>
            </Link>
          </Button>
        </ProPlan>
      </div>
    </div>
  );
};

const Perk = ({ children }: React.PropsWithChildren) => {
  return (
    <li className="flex">
      <CheckIcon className="mr-2 inline h-4 w-4 translate-y-0.5 -translate-x-0.5 text-green-600" />
      <span>{children}</span>
    </li>
  );
};

export const ProPlan = ({
  annual,
  children,
}: React.PropsWithChildren<{
  annual?: boolean;
}>) => {
  return (
    <Card className="border-primary ring-primary divide-y ring-1">
      <div className="bg-pattern p-4">
        <div className="mb-4 flex items-center gap-x-4">
          <Badge>
            <Trans i18nKey="planPro" defaults="Pro" />
          </Badge>
        </div>

        {annual ? (
          <div>
            <span className="mr-2 text-xl font-bold line-through">
              ${monthlyPriceUsd}
            </span>
            <span className="text-3xl font-bold">
              ${(annualPriceUsd / 12).toFixed(2)}
            </span>
            <div className="text-muted-foreground text-sm">
              <Trans
                i18nKey="annualBillingDescription"
                defaults="per month, billed annually"
              />
            </div>
          </div>
        ) : (
          <div>
            <span className="text-3xl font-bold">$5</span>
            <div className="text-muted-foreground text-sm">
              <Trans i18nKey="monthlyBillingDescription" defaults="per month" />
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <ul className="text-muted-foreground text-sm">
          <Perk>
            <Trans i18nKey="plan_unlimitedPolls" defaults="Unlimited polls" />
          </Perk>
          <Perk>
            <Trans
              i18nKey="plan_unlimitedParticipants"
              defaults="Unlimited participants"
            />
          </Perk>
          <Perk>
            <Trans i18nKey="plan_finalizePolls" defaults="Finalize polls" />
          </Perk>
          <Perk>
            <Trans
              i18nKey="plan_extendedPollLife"
              defaults="Extended poll life"
            />
          </Perk>
          <Perk>
            <Trans i18nKey="plan_prioritySupport" defaults="Priority support" />
          </Perk>
        </ul>
        {children}
      </div>
    </Card>
  );
};
