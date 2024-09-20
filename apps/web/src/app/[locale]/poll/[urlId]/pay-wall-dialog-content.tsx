import { pricingData } from "@rallly/billing/pricing";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { DialogClose, DialogContent } from "@rallly/ui/dialog";
import { Label } from "@rallly/ui/label";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { m } from "framer-motion";
import {
  CalendarCheck2Icon,
  ClockIcon,
  CopyIcon,
  Settings2Icon,
} from "lucide-react";
import Link from "next/link";

import { Trans } from "@/components/trans";
import { usePlan } from "@/contexts/plan";

export function PayWallDialogContent({
  children,
}: {
  children?: React.ReactNode;
}) {
  const plan = usePlan();

  if (plan === "free") {
    return (
      <DialogContent className="w-[600px] p-4">
        <article>
          <header className="mb-4 py-4">
            <m.div
              transition={{
                delay: 0.5,
                duration: 0.4,
                type: "spring",
                bounce: 0.5,
              }}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
              aria-hidden="true"
            >
              <Badge size="lg" variant="primary">
                <Trans i18nKey="planPro" />
              </Badge>
            </m.div>
            <h1 className="mb-1 mt-2 text-center text-xl font-bold">
              <Trans defaults="Upgrade to Pro" i18nKey="upgradePromptTitle" />
            </h1>
            <p className="text-muted-foreground text-center text-sm leading-relaxed">
              <Trans
                i18nKey="upgradeOverlaySubtitle3"
                defaults="Unlock these feature by upgrading to a Pro plan."
              />
            </p>
          </header>
          <section className="rounded-lg border bg-gray-50">
            <RadioGroup defaultValue="yearly" className="divide-y text-left">
              <li className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <RadioGroupItem id="monthly" value="monthly" />
                  <label className="text-base font-semibold" htmlFor="monthly">
                    <Trans defaults="1 month" i18nKey="1month" />
                  </label>
                </div>
                <p className="text-muted-foreground text-pretty leading-relaxed">
                  ${pricingData.monthly.amount / 100} per month
                </p>
              </li>
              <li className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <RadioGroupItem id="yearly" value="yearly" />
                  <label className="text-base font-semibold" htmlFor="yearly">
                    <Trans defaults="12 months" i18nKey="12months" />
                  </label>
                </div>
                <p className="text-muted-foreground text-pretty leading-relaxed">
                  ${pricingData.yearly.amount / 100} per month
                </p>
              </li>
            </RadioGroup>
          </section>
          <footer className="mt-4 grid gap-2">
            <Button variant="primary" asChild>
              <Link href="/settings/billing">
                <Trans i18nKey="subscribe" defaults="Subscribe" />
              </Link>
            </Button>
            <DialogClose asChild>
              <Button variant="ghost">
                <Trans i18nKey="notToday" defaults="Not Today" />
              </Button>
            </DialogClose>
          </footer>
        </article>
      </DialogContent>
    );
  }
  return <>{children}</>;
}
