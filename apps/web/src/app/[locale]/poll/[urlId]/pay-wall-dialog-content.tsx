import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { DialogClose, DialogContent } from "@rallly/ui/dialog";
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
      <DialogContent size="sm">
        <div>
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
        </div>
        <div className="space-y-8">
          <div>
            <h2 className=" text-center text-xl font-bold">
              <Trans defaults="Upgrade to Pro" i18nKey="upgradePromptTitle" />
            </h2>
            <p className="text-muted-foreground text-center text-sm leading-relaxed">
              <Trans
                i18nKey="upgradeOverlaySubtitle3"
                defaults="Unlock these feature by upgrading to a Pro plan."
              />
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-4 text-left">
            <li className="flex items-start gap-x-3">
              <div>
                <CalendarCheck2Icon className="size-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">
                  <Trans defaults="Finalize" i18nKey="finalize" />
                </h3>
                <p className="text-muted-foreground mt-0.5 text-pretty text-sm">
                  <Trans
                    i18nKey="finalizeFeatureDescription"
                    defaults="Select a final date for your event and notify participants."
                  />
                </p>
              </div>
            </li>
            <li className="flex items-start gap-x-3">
              <CopyIcon className="size-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-semibold">
                  <Trans defaults="Duplicate" i18nKey="duplicateTitle" />
                </h3>
                <p className="text-muted-foreground mt-0.5 text-pretty text-sm">
                  <Trans
                    i18nKey="duplicateFeatureDescription"
                    defaults="Reuse dates and settings of a poll to create a new one."
                  />
                </p>
              </div>
            </li>
            <li className="flex items-start gap-x-3">
              <div>
                <Settings2Icon className="size-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">
                  <Trans
                    defaults="Advanced Settings"
                    i18nKey="advancedSettingsTitle"
                  />
                </h3>
                <p className="text-muted-foreground mt-0.5 text-pretty text-sm">
                  <Trans
                    i18nKey="advancedSettingsDescription"
                    defaults="Hide participants, hide scores, require participant email address."
                  />
                </p>
              </div>
            </li>
            <li className="flex items-start gap-x-3">
              <div>
                <ClockIcon className="size-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">
                  <Trans
                    defaults="Keep Polls Indefinitely"
                    i18nKey="keepPollsIndefinitely"
                  />
                </h3>
                <p className="text-muted-foreground mt-0.5 text-pretty text-sm">
                  <Trans
                    i18nKey="keepPollsIndefinitelyDescription"
                    defaults="Inactive polls will not be auto-deleted."
                  />
                </p>
              </div>
            </li>
          </ul>
          <div className="grid gap-2.5">
            <Button variant="primary" asChild>
              <Link href="/settings/billing">
                <Trans i18nKey="upgrade" defaults="Upgrade" />
              </Link>
            </Button>
            <DialogClose asChild>
              <Button>
                <Trans i18nKey="notToday" defaults="Not Today" />
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    );
  }
  return <>{children}</>;
}
