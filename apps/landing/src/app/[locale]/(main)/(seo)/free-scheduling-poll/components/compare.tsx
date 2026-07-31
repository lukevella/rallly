import { CalendarClockIcon, MailIcon, VoteIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";

function Method({
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

export async function Compare(props: { locale: string }) {
  const { t } = await getTranslation(props.locale, ["home"]);
  return (
    <section>
      <header className="text-center">
        <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollCompareTitle"
            defaults="The easiest way to plan a meeting with a group"
          />
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-gray-500 sm:text-lg">
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollCompareDescription"
            defaults="There are plenty of ways to schedule a meeting, but most of them start to break down as soon as more than two people are involved."
          />
        </p>
      </header>
      <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-3">
        <Method
          icon={<MailIcon className="size-5" />}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollCompareEmailTitle"
              defaults="Email back and forth"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollCompareEmailDescription"
            defaults="Twenty replies deep and still no date. Long email threads make it hard to keep track of who can make it and when."
          />
        </Method>
        <Method
          icon={<CalendarClockIcon className="size-5" />}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollCompareBookingTitle"
              defaults="Booking pages"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollCompareBookingDescription"
            defaults="Booking pages are great for one on one appointments, but they fall short when a whole group needs to agree on a single time."
          />
        </Method>
        <Method
          icon={<VoteIcon className="size-5" />}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollComparePollTitle"
              defaults="Scheduling polls"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollComparePollDescription"
            defaults="Propose a few times, let everyone vote, and pick the winner. It is the fastest way to schedule a meeting with three or more people."
          />
        </Method>
      </div>
      <p className="mt-8 text-center text-gray-500">
        <Trans
          t={t}
          ns="home"
          i18nKey="schedulingPollCompareAlternatives"
          components={{
            doodle: (
              <Link className="text-link" href="/best-doodle-alternative" />
            ),
            when2meet: (
              <Link className="text-link" href="/when2meet-alternative" />
            ),
          }}
          defaults="Already using another meeting scheduling tool? See how Rallly compares to <doodle>Doodle</doodle> and <when2meet>When2Meet</when2meet>."
        />
      </p>
    </section>
  );
}
