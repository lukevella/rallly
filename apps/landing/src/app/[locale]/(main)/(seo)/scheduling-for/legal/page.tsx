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
          title={t("legalTitle", {
            ns: "home",
            defaultValue: "Scheduling for law firms and mediators",
          })}
          description={t("legalDescription", {
            ns: "home",
            defaultValue:
              "Find a date that suits both sides, the client and the neutral without a week of letters between offices. Share one link, see exactly who can attend each slot, and confirm the date. Free, and opposing counsel does not need an account.",
          })}
        >
          <HeroDemo locale={locale} preset="legal" />
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
                    i18nKey="legalFaqOpposingCounsel"
                    defaults="Can opposing counsel respond without signing up?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="legalFaqOpposingCounselAnswer"
                  defaults="Yes. Anyone with the link can reply whether or not they use Rallly, and whichever system their own firm runs. That matters when you are coordinating across firms, because the other side has no reason to adopt a tool just to give you three dates."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="legalFaqAllParties"
                    defaults="Everyone has to attend, not just a majority. Does that work?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="legalFaqAllPartiesAnswer"
                  defaults="Yes. Every slot shows exactly who can attend and who cannot, rather than only a total, so you can find the dates where counsel for both sides, the clients and the neutral are all free, and rule out the ones where a required party said no."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="legalFaqConfidential"
                    defaults="Will the poll reveal our client or matter details?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="legalFaqConfidentialAnswer"
                  defaults="Only what you choose to put in it. Many firms title the poll by matter reference rather than by party name, and leave the description empty. With <0>Rallly Pro</0> you can also hide participant names, so one side cannot see who else was invited, and hide votes until someone has responded themselves."
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
                    i18nKey="legalFaqTimeZones"
                    defaults="Does it handle parties in different jurisdictions?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="legalFaqTimeZonesAnswer"
                  defaults="Yes. Each participant sees the proposed slots in their own time zone automatically, so counsel in London and a client in New York are looking at the same slot without either of them converting anything by hand."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="legalFaqBranding"
                    defaults="Can polls carry our firm branding?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="legalFaqBrandingAnswer"
                  defaults="With <0>Rallly Pro</0> you can add your own logo and colours and remove Rallly attribution, so a poll you send to another firm or a client looks like it came from your practice. Everything else is free to use."
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
                i18nKey="legalFinalCtaTitle"
                defaults="Ready to get the date agreed?"
              />
            }
            description={
              <Trans
                t={t}
                ns="home"
                i18nKey="legalFinalCtaDescription"
                defaults="Set up your poll in under a minute, send one link to all parties, and stop trading availability by email."
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
    alternates: getAlternates({ locale, path: "/scheduling-for/legal" }),
    title: t("legalMetaTitle", {
      ns: "home",
      defaultValue: "Scheduling for Law Firms and Mediators",
    }),
    description: t("legalMetaDescription", {
      ns: "home",
      defaultValue:
        "Rallly is a free scheduling tool for mediations, hearings and client conferences. Find a date that works for both sides with one link. No account needed to respond.",
    }),
  };
}
