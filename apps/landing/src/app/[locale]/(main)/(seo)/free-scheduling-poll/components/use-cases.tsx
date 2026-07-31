import {
  BriefcaseIcon,
  GraduationCapIcon,
  HeartIcon,
  UsersIcon,
} from "lucide-react";
import type React from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";

function UseCase({
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

export async function UseCases(props: { locale: string }) {
  const { t } = await getTranslation(props.locale, ["home"]);
  return (
    <section>
      <header className="text-center">
        <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollUseCasesTitle"
            defaults="A scheduling tool for every kind of group"
          />
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-gray-500 sm:text-lg">
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollUseCasesDescription"
            defaults="From quick team syncs to large community events, a scheduling poll is the fastest way to plan a meeting with more than a few people."
          />
        </p>
      </header>
      <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2">
        <UseCase
          icon={<BriefcaseIcon className="size-5" />}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollUseCaseWorkTitle"
              defaults="Work meetings"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollUseCaseWorkDescription"
            defaults="Use Rallly as an online meeting scheduler for team syncs, project kickoffs, and client calls. Find a time that suits colleagues across offices and time zones."
          />
        </UseCase>
        <UseCase
          icon={<UsersIcon className="size-5" />}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollUseCaseCommunityTitle"
              defaults="Clubs and communities"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollUseCaseCommunityDescription"
            defaults="Plan rehearsals, training sessions, and volunteer meetups. Group scheduling stays simple even when dozens of people need to agree on a date."
          />
        </UseCase>
        <UseCase
          icon={<HeartIcon className="size-5" />}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollUseCaseFriendsTitle"
              defaults="Friends and family"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollUseCaseFriendsDescription"
            defaults="Organize dinners, trips, and reunions with a simple meeting planner that everyone can use from their phone. There is no app to install."
          />
        </UseCase>
        <UseCase
          icon={<GraduationCapIcon className="size-5" />}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollUseCaseClassesTitle"
              defaults="Classes and workshops"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollUseCaseClassesDescription"
            defaults="Teachers, coaches, and organizers use meeting polls to find the session times that most participants can attend."
          />
        </UseCase>
      </div>
    </section>
  );
}
