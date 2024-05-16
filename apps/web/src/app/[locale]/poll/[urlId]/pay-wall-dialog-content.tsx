import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { DialogClose, DialogContent } from "@rallly/ui/dialog";
import { m } from "framer-motion";
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
            <Badge variant="primary">
              <Trans i18nKey="planPro" />
            </Badge>
          </m.div>
          <div className="mt-4 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-center text-xl font-bold">
                <Trans defaults="Pro Feature" i18nKey="proFeature" />
              </h2>
              <p className="text-muted-foreground mx-auto max-w-xs text-center text-sm leading-relaxed">
                <Trans
                  i18nKey="upgradeOverlaySubtitle2"
                  defaults="Please upgrade to a paid plan to use this feature. This is how we keep the lights on :)"
                />
              </p>
            </div>
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
        </div>
      </DialogContent>
    );
  }
  return <>{children}</>;
}
