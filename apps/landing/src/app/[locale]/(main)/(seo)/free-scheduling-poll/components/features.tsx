import {
  BellRingIcon,
  CalendarCheck2Icon,
  CodeIcon,
  GlobeIcon,
  ThumbsUpIcon,
  UserCheckIcon,
} from "lucide-react";
import type React from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";

function Feature({
  icon,
  title,
  children,
}: React.PropsWithChildren<{
  icon: React.ReactNode;
  title: React.ReactNode;
}>) {
  return (
    <div className="rounded-md border bg-white p-6">
      <div className="flex size-10 items-center justify-center rounded-md bg-gray-800 text-gray-50">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-gray-500">{children}</p>
    </div>
  );
}

export async function Features(props: { locale: string }) {
  const { t } = await getTranslation(props.locale, ["home"]);
  return (
    <section>
      <header className="text-center">
        <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFeaturesTitle"
            defaults="Everything you need to schedule group meetings"
          />
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-gray-500 sm:text-lg">
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFeaturesDescription"
            defaults="Whether you call it an availability poll, a meeting poll, or a group scheduling tool, Rallly gives you everything you need to find the best time to meet."
          />
        </p>
      </header>
      <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
        <Feature
          icon={<CalendarCheck2Icon className="size-5" />}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFeatureAvailabilityTitle"
              defaults="Availability polls"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFeatureAvailabilityDescription"
            defaults="See everyone's availability side by side and instantly spot the times that work for the whole group."
          />
        </Feature>
        <Feature
          icon={<ThumbsUpIcon className="size-5" />}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFeatureVotingTitle"
              defaults="Flexible voting"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFeatureVotingDescription"
            defaults="Participants can answer with yes, no, or if need be, so you can tell a perfect time apart from a possible one."
          />
        </Feature>
        <Feature
          icon={<GlobeIcon className="size-5" />}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFeatureTimeZonesTitle"
              defaults="Automatic time zone conversion"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFeatureTimeZonesDescription"
            defaults="Scheduling across time zones? Each participant sees the proposed times in their own time zone, so nobody shows up an hour late."
          />
        </Feature>
        <Feature
          icon={<BellRingIcon className="size-5" />}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFeatureNotificationsTitle"
              defaults="Notifications"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFeatureNotificationsDescription"
            defaults="Get notified when participants respond, so you can finalize your plans without chasing people for answers."
          />
        </Feature>
        <Feature
          icon={<UserCheckIcon className="size-5" />}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFeatureNoAccountTitle"
              defaults="No account needed to vote"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFeatureNoAccountDescription"
            defaults="Participants just open the link and vote. Share your poll and start collecting responses right away."
          />
        </Feature>
        <Feature
          icon={<CodeIcon className="size-5" />}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFeatureOpenSourceTitle"
              defaults="Free and open source"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFeatureOpenSourceDescription"
            defaults="Rallly is free to use, shows no ads, and its code is open source, so you always know how your data is handled."
          />
        </Feature>
      </div>
    </section>
  );
}
