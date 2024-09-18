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
      <DialogContent className="w-[600px] p-4">
        <article>
          <header className="p-4">
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
            <ul className="divide-y text-left">
              <li className="flex items-start gap-x-4 p-4">
                <div>
                  <div className="inline-flex rounded-lg bg-indigo-100 p-2">
                    <CalendarCheck2Icon className="size-4 text-indigo-600" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold">
                    <Trans defaults="Finalize" i18nKey="finalize" />
                  </h3>
                  <p className="text-muted-foreground text-pretty text-sm leading-relaxed">
                    <Trans
                      i18nKey="finalizeFeatureDescription"
                      defaults="Select a final date for your event and notify participants."
                    />
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-x-4 p-4">
                <div className="inline-flex rounded-lg bg-violet-100 p-2">
                  <CopyIcon className="size-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold">
                    <Trans defaults="Duplicate" i18nKey="duplicateTitle" />
                  </h3>
                  <p className="text-muted-foreground leading-rel text-pretty text-sm">
                    <Trans
                      i18nKey="duplicateFeatureDescription"
                      defaults="Reuse dates and settings of a poll to create a new one."
                    />
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-x-4 p-4">
                <div>
                  <div className="inline-flex rounded-lg bg-purple-100 p-2">
                    <Settings2Icon className="size-4 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold">
                    <Trans
                      defaults="Advanced Settings"
                      i18nKey="advancedSettingsTitle"
                    />
                  </h3>
                  <p className="text-muted-foreground leading-rel text-pretty text-sm">
                    <Trans
                      i18nKey="advancedSettingsDescription"
                      defaults="Hide participants, hide scores, require participant email address."
                    />
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-x-4 p-4">
                <div>
                  <div className="inline-flex rounded-lg bg-pink-100 p-2">
                    <ClockIcon className="size-4 text-pink-600" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold">
                    <Trans
                      defaults="Keep Polls Indefinitely"
                      i18nKey="keepPollsIndefinitely"
                    />
                  </h3>
                  <p className="text-muted-foreground leading-rel text-pretty text-sm">
                    <Trans
                      i18nKey="keepPollsIndefinitelyDescription"
                      defaults="Inactive polls will not be auto-deleted."
                    />
                  </p>
                </div>
              </li>
            </ul>
          </section>
          <footer className="mt-4 grid gap-2.5">
            <Button variant="primary" asChild>
              <Link href="/settings/billing">
                <Trans i18nKey="upgrade" defaults="Upgrade" />
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
