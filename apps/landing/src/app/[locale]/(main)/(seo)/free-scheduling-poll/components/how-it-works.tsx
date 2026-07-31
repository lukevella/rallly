import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";

export async function HowItWorks(props: { locale: string }) {
  const { t } = await getTranslation(props.locale, ["home"]);
  return (
    <section>
      <header className="text-center">
        <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollHowItWorksTitle"
            defaults="How to create a scheduling poll"
          />
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-gray-500 sm:text-lg">
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollHowItWorksDescription"
            defaults="Rallly is a free meeting scheduler that helps your group agree on a time in three simple steps."
          />
        </p>
      </header>
      <ol className="mt-8 grid gap-8 sm:mt-12 sm:grid-cols-3">
        <li className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-gray-800 font-semibold text-gray-50"
          >
            1
          </span>
          <h3 className="mt-4 font-semibold text-lg">
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollStep1Title"
              defaults="Pick your options"
            />
          </h3>
          <p className="mt-2 text-gray-500">
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollStep1Description"
              defaults="Choose the dates and times you can offer. Add as many options as you like, with or without specific times."
            />
          </p>
        </li>
        <li className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-gray-800 font-semibold text-gray-50"
          >
            2
          </span>
          <h3 className="mt-4 font-semibold text-lg">
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollStep2Title"
              defaults="Share your link"
            />
          </h3>
          <p className="mt-2 text-gray-500">
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollStep2Description"
              defaults="Send the poll link to your group by email or chat. Participants vote on their availability from any device without creating an account."
            />
          </p>
        </li>
        <li className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-gray-800 font-semibold text-gray-50"
          >
            3
          </span>
          <h3 className="mt-4 font-semibold text-lg">
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollStep3Title"
              defaults="Pick the best time"
            />
          </h3>
          <p className="mt-2 text-gray-500">
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollStep3Description"
              defaults="Votes appear in real time, so you can spot the option that works for everyone and lock in the best time to meet."
            />
          </p>
        </li>
      </ol>
    </section>
  );
}
