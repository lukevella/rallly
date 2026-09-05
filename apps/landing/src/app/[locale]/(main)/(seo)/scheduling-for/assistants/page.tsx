"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";
import { PeopleBadge, PollsBadge } from "@/components/home/animated-number";
import { Cta } from "@/components/home/cta";
import { Faq, FaqItem } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { HeroDemo } from "@/components/home/hero-demo/hero-demo";
import { HowItWorks } from "@/components/home/how-it-works/how-it-works";
import { SocialProof } from "@/components/home/social-proof";
import { Stats } from "@/components/home/stats";
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeading,
  SectionTitle,
} from "@/components/section";
import { getTranslation } from "@/i18n/server";
import { getAlternates } from "@/lib/alternates";
import { getMonthlyPollCount, getMonthlyVoterCount } from "@/lib/data";

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  cacheLife("hours");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, ["home"]);
  const [pollCount, voterCount] = await Promise.all([
    getMonthlyPollCount(),
    getMonthlyVoterCount(),
  ]);
  return (
    <div className="divide-y">
      <Section>
        <Hero
          title={t("eaTitle", {
            ns: "home",
            defaultValue: "Scheduling for assistants",
          })}
          description={t("eaDescription", {
            ns: "home",
            defaultValue:
              "Whether you support one executive or a whole department, find a time that works across a dozen busy calendars without a single follow-up email. Share one link, watch the responses land, and lock in the slot everyone can make. Free, and nobody you invite needs an account.",
          })}
        >
          <HeroDemo locale={locale} preset="executiveAssistant" />
        </Hero>
        <Stats className="mt-8 sm:mt-24">
          <Trans
            t={t}
            ns="home"
            i18nKey="statsLast30Days"
            defaults="<0>{voterCount, plural, one {# person} other {# people}}</0> voted on <1>{pollCount, plural, one {# poll} other {# polls}}</1> in the last 30 days"
            values={{ voterCount, pollCount }}
            components={[
              <PeopleBadge key="people" locale={locale} />,
              <PollsBadge key="polls" locale={locale} />,
            ]}
          />
        </Stats>
      </Section>
      <HowItWorks locale={locale} />
      <SocialProof locale={locale} />
      <div>
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
          <SectionContent>
            <Faq>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="eaFaqExternalGuests"
                    defaults="Can I invite people outside my organization?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="eaFaqExternalGuestsAnswer"
                  defaults="Yes. Anyone with the link can respond, whether or not they use Rallly and whichever calendar system their company runs on. They don't need an account and there is no limit on how many people you invite, so board members, clients and external counsel can all reply the same way."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="eaFaqOnBehalf"
                    defaults="Can I schedule on behalf of someone else?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="eaFaqOnBehalfAnswer"
                  defaults="Yes. You create and manage the poll, so the responses come back to you and you decide the final time. You can also add participants and fill in availability on someone's behalf, which is useful when a principal sends you their times directly instead of clicking the link."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="eaFaqTimeZones"
                    defaults="Does it handle meetings across time zones?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="eaFaqTimeZonesAnswer"
                  defaults="Yes. Each participant sees the proposed times in their own time zone automatically, so a London board member and a San Francisco executive are looking at the same slot without either of you converting anything by hand."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="eaFaqChasing"
                    defaults="Do I still have to chase people for replies?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="eaFaqChasingAnswer"
                  defaults="You can see at a glance who has responded and who hasn't, and get an email as responses come in. That turns the usual round of follow-up emails into a single reminder to the few people still outstanding."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="eaFaqBranding"
                    defaults="Can polls carry our company branding?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="eaFaqBrandingAnswer"
                  defaults="With <0>Rallly Pro</0> you can add your own logo and colours and remove Rallly attribution, so a poll you send to a board or a client looks like it came from your organization. Everything else is free to use."
                  components={[
                    <Link
                      key="pricing"
                      className="text-gray-800 underline underline-offset-2 hover:text-gray-600"
                      href="/pricing"
                    />,
                  ]}
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="faqPrivacy"
                    defaults="Is my data private?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="faqPrivacyAnswer"
                  defaults="Yes. Privacy is central to how we build Rallly. We do not show ads or sell your data, we collect only what we need to run the service, and polls on the free plan are deleted automatically once they become inactive. Rallly is also open source, so anyone can inspect how their data is handled. You can read the details in our <0>privacy policy</0>."
                  components={[
                    <Link
                      key="privacy"
                      className="text-gray-800 underline underline-offset-2 hover:text-gray-600"
                      href="/privacy-policy"
                    />,
                  ]}
                />
              </FaqItem>
            </Faq>
          </SectionContent>
        </Section>
        <Section className="sm:py-24">
          <Cta
            title={
              <Trans
                t={t}
                ns="home"
                i18nKey="eaFinalCtaTitle"
                defaults="Ready to get that meeting in the diary?"
              />
            }
            description={
              <Trans
                t={t}
                ns="home"
                i18nKey="eaFinalCtaDescription"
                defaults="Set up your poll in under a minute, send one link, and stop chasing replies."
              />
            }
            buttonLabel={
              <Trans
                t={t}
                ns="home"
                i18nKey="createAPoll"
                defaults="Create a poll"
              />
            }
            hint={
              <Trans
                t={t}
                ns="home"
                i18nKey="hint"
                defaults="It's free! No login required."
              />
            }
          />
        </Section>
      </div>
    </div>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  cacheLife("max");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, "home");
  return {
    alternates: getAlternates({
      locale,
      path: "/scheduling-for/assistants",
    }),
    title: t("eaMetaTitle", {
      ns: "home",
      defaultValue: "Scheduling for Assistants | Free Meeting Poll Tool",
    }),
    description: t("eaMetaDescription", {
      ns: "home",
      defaultValue:
        "Rallly is a free scheduling tool for executive, administrative and personal assistants. Coordinate meetings across busy calendars and time zones with one link. No account needed to respond.",
    }),
  };
}
