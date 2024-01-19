import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { m } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

import { Trans } from "@/components/trans";
import { usePlan } from "@/contexts/plan";

const Teaser = () => {
  const params = useParams();

  return (
    <m.div
      transition={{
        delay: 0.3,
        duration: 1,
        type: "spring",
        bounce: 0.5,
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="sm:shadow-huge mx-auto w-[420px] max-w-full translate-y-0 space-y-2 rounded-md border bg-gray-50/90 p-4 shadow-sm sm:space-y-6"
    >
      <div className="pt-4">
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
          <Badge className="translate-y-0 px-4 py-0.5 text-lg">
            <Trans i18nKey="planPro" />
          </Badge>
        </m.div>
      </div>

      <div className="space-y-6">
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
          <Button asChild className="w-full">
            <Link href={`/poll/${params?.urlId as string}`}>
              <Trans i18nKey="notToday" defaults="Not Today" />
            </Link>
          </Button>
        </div>
      </div>
    </m.div>
  );
};

export const PayWall = ({ children }: React.PropsWithChildren) => {
  const isPaid = usePlan() === "paid";

  if (isPaid) {
    return <>{children}</>;
  }
  return (
    <div className="relative">
      <div className="pointer-events-none absolute top-8 hidden w-full scale-90 opacity-20 blur-sm sm:block">
        {children}
      </div>
      <div className="relative z-10 w-full">
        <Teaser />
      </div>
    </div>
  );
};

export const PayWallTeaser = ({ children }: React.PropsWithChildren) => {
  return <div>{children}</div>;
};
