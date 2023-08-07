import { LockIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import Link from "next/link";

import { ProPlan } from "@/components/billing/billing-plans";
import { Trans } from "@/components/trans";
import { usePlan } from "@/contexts/plan";

const Teaser = () => {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/10  backdrop-blur-sm">
      <div className="shadow-huge space-y-4 overflow-hidden rounded-md bg-white p-4">
        <div className="flex gap-x-4">
          <div className="grid gap-1">
            <h2 className="text-base font-semibold leading-tight">
              <Trans i18nKey="upgradeOverlayTitle" defaults="Upgrade" />
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              <Trans
                i18nKey="upgradeOverlaySubtitle"
                defaults="A paid plan is required to use this feature"
              />
            </p>
          </div>
        </div>
        <Button variant="primary" asChild className="w-full">
          <Link href="/settings/billing">
            <Trans
              i18nKey="upgradeOverlayGoToBilling"
              defaults="Go to billing"
            />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export const PayWall = ({ children }: React.PropsWithChildren) => {
  const isFree = usePlan() === "free";
  return (
    <div className="relative">
      {isFree ? <Teaser /> : null}
      {children}
    </div>
  );
};
