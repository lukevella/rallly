import {
  CalendarCheck2Icon,
  CopyIcon,
  DatabaseIcon,
  HeartIcon,
  ImageOffIcon,
  LockIcon,
  Settings2Icon,
  TrendingUpIcon,
} from "@rallly/icons";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import { m } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

import { Trans } from "@/components/trans";
import { UpgradeButton } from "@/components/upgrade-button";
import { usePlan } from "@/contexts/plan";
import { IconComponent } from "@/types";
import { annualPriceUsd, monthlyPriceUsd } from "@/utils/constants";

const Feature = ({
  icon: Icon,
  children,
  className,
  upcoming,
}: React.PropsWithChildren<{
  icon: IconComponent;
  upcoming?: boolean;
  className?: string;
}>) => {
  return (
    <li
      className={cn(
        "flex translate-y-0 cursor-default items-center justify-center gap-x-2.5 rounded-full border bg-gray-50 p-1 pr-4 shadow-sm transition-all hover:-translate-y-1 hover:bg-white/50",
        upcoming ? "bg-transparent` border-dashed shadow-none" : "",
      )}
    >
      <span
        className={cn("bg-primary rounded-full p-1 text-gray-50", className)}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="text-sm font-semibold">{children}</div>
    </li>
  );
};

const Teaser = () => {
  const router = useRouter();

  const [tab, setTab] = React.useState("yearly");

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
          <h2 className="text-center">
            <Trans defaults="Pro Feature" i18nKey="proFeature" />
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xs text-center text-sm leading-relaxed">
            <Trans
              i18nKey="upgradeOverlaySubtitle2"
              defaults="Please upgrade to a paid plan to use this feature. This is how we keep the lights on :)"
            />
          </p>
        </div>
        <Tabs
          className="flex flex-col items-center gap-4"
          value={tab}
          onValueChange={setTab}
        >
          <TabsList>
            <TabsTrigger value="monthly">
              <Trans i18nKey="billingPeriodMonthly" />
            </TabsTrigger>
            <TabsTrigger value="yearly">
              <Trans i18nKey="billingPeriodYearly" />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            <div>
              <div className="flex items-start justify-center gap-2.5">
                <div className=" text-4xl font-bold">${monthlyPriceUsd}</div>
                <div>
                  <div className="text-xs font-semibold leading-5">USD</div>
                </div>
              </div>
              <div className="text-muted-foreground text-sm">
                <Trans i18nKey="monthlyBillingDescription" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="yearly">
            <div className="text-center">
              <div className="flex items-start justify-center gap-2.5">
                <div className="flex items-end gap-2">
                  <div className="font-bold text-gray-500 line-through">
                    ${monthlyPriceUsd}
                  </div>
                  <div className=" text-4xl font-bold">
                    ${(annualPriceUsd / 12).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="mt-1 text-xs font-semibold">USD</div>
                </div>
              </div>
              <div className="text-muted-foreground text-sm">
                <Trans i18nKey="annualBillingDescription" />
              </div>
              <p className="mt-2">
                <span className="rounded border border-dashed border-green-400 px-1 py-0.5 text-xs text-green-500">
                  <Trans
                    i18nKey="savePercent"
                    defaults="Save {percent}%"
                    values={{
                      percent: (annualPriceUsd / 12 / monthlyPriceUsd) * 100,
                    }}
                  />
                </span>
              </p>
            </div>
          </TabsContent>
        </Tabs>
        <div className="space-y-2">
          <p className="text-primary text-center text-xs">
            <Link
              className="text-link"
              href="https://rallly.co/blog/july-recap"
              target="_blank"
            >
              <TrendingUpIcon className="mr-2 inline-block h-4 w-4" />
              <Trans
                i18nKey="priceIncreaseSoon"
                defaults="Price increase soon."
              />
            </Link>
          </p>
          <p className="text-center text-xs text-gray-400">
            <LockIcon className="mr-2 inline-block h-4 w-4" />
            <Trans
              i18nKey="lockPrice"
              defaults="Upgrade today to keep this price forever."
            />
          </p>
        </div>
        <h3 className="mx-auto max-w-sm text-center">
          <Trans
            i18nKey="features"
            defaults="Get access to all current and future Pro features!"
          />
        </h3>
        <ul className="flex flex-wrap justify-center gap-2 border-gray-100 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-100 via-transparent">
          <Feature className="bg-violet-500" icon={ImageOffIcon}>
            <Trans i18nKey="noAds" defaults="No ads" />
          </Feature>
          <Feature className="bg-rose-500" icon={DatabaseIcon}>
            <Trans
              i18nKey="plan_extendedPollLife"
              defaults="Extend poll life"
            />
          </Feature>
          <Feature className="bg-green-500" icon={CalendarCheck2Icon}>
            <Trans i18nKey="finalizeFeature" defaults="Finalize" />
          </Feature>
          <Feature className="bg-teal-500" icon={CopyIcon}>
            <Trans i18nKey="duplicateFeature" defaults="Duplicate" />
          </Feature>
          <Feature className="bg-gray-700" icon={Settings2Icon}>
            <Trans i18nKey="settings" defaults="Settings" />
          </Feature>
          <Feature className="bg-pink-600" icon={HeartIcon}>
            <Trans i18nKey="supportProject" defaults="Support this project" />
          </Feature>
        </ul>
        <div className="grid gap-2.5">
          <UpgradeButton annual={tab === "yearly"}>
            <Trans i18nKey="upgrade" defaults="Upgrade" />
          </UpgradeButton>
          <Button asChild className="w-full">
            <Link href={`/poll/${router.query.urlId as string}`}>
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
