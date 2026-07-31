import type React from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";

function FaqItem({
  question,
  children,
}: React.PropsWithChildren<{
  question: React.ReactNode;
}>) {
  return (
    <div>
      <h3 className="font-semibold text-lg">{question}</h3>
      <p className="mt-2 text-gray-500 leading-relaxed">{children}</p>
    </div>
  );
}

export async function Faq(props: { locale: string }) {
  const { t } = await getTranslation(props.locale, ["home"]);
  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="text-center font-bold text-2xl tracking-tight sm:text-3xl">
        <Trans
          t={t}
          ns="home"
          i18nKey="schedulingPollFaqTitle"
          defaults="Frequently asked questions"
        />
      </h2>
      <div className="mt-8 space-y-8 sm:mt-12">
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFaqWhatIsQuestion"
              defaults="What is a scheduling poll?"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFaqWhatIsAnswer"
            defaults="A scheduling poll is a simple form that lets a group vote on proposed meeting times. Instead of comparing calendars or trading emails, everyone marks the times they are available and the option with the most votes wins."
          />
        </FaqItem>
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFaqNamesQuestion"
              defaults="What is the difference between a scheduling poll, an availability poll, and a meeting poll?"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFaqNamesAnswer"
            defaults="They are different names for the same idea: a poll that collects everyone's availability so you can find the best time to meet. Whichever name you use, Rallly covers it with one simple tool."
          />
        </FaqItem>
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFaqFreeQuestion"
              defaults="Is Rallly really free?"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFaqFreeAnswer"
            defaults="Yes. Creating a scheduling poll is free and there are no ads. Rallly also offers an optional paid plan with extra features for frequent users, such as keeping polls indefinitely."
          />
        </FaqItem>
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFaqAccountQuestion"
              defaults="Do participants need to create an account?"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFaqAccountAnswer"
            defaults="No. Participants just open the poll link and vote from any device. You do not even need an account to create a poll."
          />
        </FaqItem>
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFaqLimitQuestion"
              defaults="How many people can vote on a scheduling poll?"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFaqLimitAnswer"
            defaults="There is no fixed limit. Rallly works just as well for a group of five as it does for large groups with dozens of participants."
          />
        </FaqItem>
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFaqTimeZonesQuestion"
              defaults="Does Rallly work across time zones?"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFaqTimeZonesAnswer"
            defaults="Yes. With time zone support enabled, every participant sees the proposed times in their own time zone and votes are converted automatically."
          />
        </FaqItem>
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFaqBookingQuestion"
              defaults="How is a meeting poll different from a booking page?"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFaqBookingAnswer"
            defaults="A booking page shares one person's availability so others can pick a slot. A meeting poll gathers the availability of the whole group so you can settle on one time together. For group meetings, a poll is usually the faster option."
          />
        </FaqItem>
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="schedulingPollFaqMobileQuestion"
              defaults="Can I use Rallly on my phone?"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="schedulingPollFaqMobileAnswer"
            defaults="Yes. Rallly runs in any modern browser and is designed to work great on mobile, so participants can vote wherever they are."
          />
        </FaqItem>
      </div>
    </section>
  );
}
