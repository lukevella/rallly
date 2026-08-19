import { PlusIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeading,
  SectionTitle,
} from "@/components/section";
import { getTranslation } from "@/i18n/server";

function FaqItem({
  question,
  answer,
}: {
  question: React.ReactNode;
  answer: React.ReactNode;
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium text-base text-gray-800 [&::-webkit-details-marker]:hidden">
        {question}
        <PlusIcon className="size-4 shrink-0 text-gray-400 transition-transform group-open:rotate-45" />
      </summary>
      <p className="max-w-prose pb-5 text-gray-500 text-sm leading-relaxed sm:text-base">
        {answer}
      </p>
    </details>
  );
}

export async function Faq({ locale }: { locale: string }) {
  const { t } = await getTranslation(locale, ["home"]);
  return (
    <Section>
      <SectionHeading>
        <SectionTitle>
          <Trans
            t={t}
            ns="home"
            i18nKey="faqTitle"
            defaults="Frequently asked questions"
          />
        </SectionTitle>
        <SectionDescription>
          <Trans
            t={t}
            ns="home"
            i18nKey="faqDescription"
            defaults="Quick answers about how Rallly works, pricing, and privacy."
          />
        </SectionDescription>
      </SectionHeading>
      <SectionContent className="divide-y border-y">
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqWhatIsRallly"
              defaults="What is Rallly?"
            />
          }
          answer={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqWhatIsRalllyAnswer"
              defaults="Rallly is a meeting scheduling tool. You create a poll with a few proposed times, share a link, and participants vote on the times that work for them. When the votes are in, you can see at a glance which time suits everyone best."
            />
          }
        />
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqNeedAccount"
              defaults="Do I need an account to use Rallly?"
            />
          }
          answer={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqNeedAccountAnswer"
              defaults="No. You can create a poll and vote on one without signing up. Creating a free account lets you manage your polls from any device and get notified when people respond."
            />
          }
        />
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqIsFree"
              defaults="Is Rallly free?"
            />
          }
          answer={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqIsFreeAnswer"
              defaults="Yes. 99% of people use Rallly completely free. Creating polls, sharing them, and collecting votes costs nothing and there is no limit on participants. We also offer <0>Rallly Pro</0>, a paid subscription with features that are useful if you use Rallly professionally, like adding your own branding, removing Rallly attribution from your polls, and keeping polls around indefinitely."
              components={[
                <Link
                  key="pricing"
                  className="text-gray-800 underline underline-offset-2 hover:text-gray-600"
                  href="/pricing"
                />,
              ]}
            />
          }
        />
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqNonprofit"
              defaults="Do you offer discounts for nonprofits?"
            />
          }
          answer={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqNonprofitAnswer"
              defaults="Yes. We offer discounted Rallly Pro subscriptions for registered nonprofits. Email us at <0>support@rallly.co</0> and we will get you set up."
              components={[
                <a
                  key="email"
                  className="text-gray-800 underline underline-offset-2 hover:text-gray-600"
                  href="mailto:support@rallly.co"
                />,
              ]}
            />
          }
        />
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqTeams"
              defaults="How does Rallly work for teams?"
            />
          }
          answer={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqTeamsAnswer"
              defaults="You can invite your team into a shared space where everyone creates and manages polls together. Billing is centralized. A single subscription covers the whole team, and you can add or remove seats as your team changes."
            />
          }
        />
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqSelfHost"
              defaults="Can I self-host Rallly?"
            />
          }
          answer={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqSelfHostAnswer"
              defaults="Yes. Rallly is open source and can be deployed on your own infrastructure with Docker. Check the <0>self-hosting docs</0> to get started."
              components={[
                <a
                  key="docs"
                  className="text-gray-800 underline underline-offset-2 hover:text-gray-600"
                  href="https://support.rallly.co/self-hosting/installation/docker"
                />,
              ]}
            />
          }
        />
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqTimeZones"
              defaults="Does Rallly work across time zones?"
            />
          }
          answer={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqTimeZonesAnswer"
              defaults="Yes. When you create a poll with specific times, each participant sees the options in their own time zone automatically, so nobody has to do the math."
            />
          }
        />
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqAfterVoting"
              defaults="What happens after everyone votes?"
            />
          }
          answer={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqAfterVotingAnswer"
              defaults="The results show which times work for the most people. With Rallly Pro you can finalize the poll, which notifies participants of the chosen time by email."
            />
          }
        />
        <FaqItem
          question={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqPrivacy"
              defaults="Is my data private?"
            />
          }
          answer={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqPrivacyAnswer"
              defaults="Rallly does not show ads or sell your data, and polls on the free plan are deleted automatically when they become inactive. You can read the details in our <0>privacy policy</0>."
              components={[
                <Link
                  key="privacy"
                  className="text-gray-800 underline underline-offset-2 hover:text-gray-600"
                  href="/privacy-policy"
                />,
              ]}
            />
          }
        />
      </SectionContent>
    </Section>
  );
}
