"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";
import { PeopleBadge, PollsBadge } from "@/components/home/animated-number";
import { Cta } from "@/components/home/cta";
import { Faq, FaqItem } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { HeroDemo } from "@/components/home/hero-demo/hero-demo";
import { HowItWorks } from "@/components/home/how-it-works/how-it-works";
import { Mention, Mentions } from "@/components/home/mentions";
import { Stats } from "@/components/home/stats";
import { Testimonial } from "@/components/home/testimonial";
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeading,
  SectionTitle,
} from "@/components/section";
import { getTranslation } from "@/i18n/server";
import { getMonthlyPollCount, getMonthlyVoterCount } from "@/lib/data";

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  cacheLife("days");
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
          title={t("freeSchedulingPollTitle", {
            ns: "home",
          })}
          description={t("freeSchedulingPollDescription", {
            ns: "home",
          })}
        >
          <HeroDemo locale={locale} />
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
      <Section>
        <Testimonial
          logo={
            <Image
              src="/static/images/mit-logo.svg"
              width={54}
              height={28}
              alt=""
            />
          }
          avatar={
            <Image
              className="rounded-full"
              src="/static/images/eric.png"
              width={48}
              height={48}
              alt=""
            />
          }
          name="Eric Fletcher"
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="ericJobTitle"
              defaults="Executive Assistant at MIT"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="ericQuote"
            defaults="“If your scheduling workflow lives in emails, I strongly encourage you to try and let Rallly simplify your scheduling tasks for a more organized and less stressful workday.”"
          />
        </Testimonial>
      </Section>
      <Section>
        <Mentions>
          <Mention
            delay={0.25}
            logo={
              <div className="relative h-8 w-14">
                <Image
                  src="/static/images/pcmag-logo.svg"
                  alt="PCMag"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="pcmagQuote"
              defaults="“Set up a scheduling poll in as little time as possible.”"
            />
          </Mention>
          <Mention
            delay={0.5}
            logo={
              <div className="relative h-8 w-24">
                <Image
                  src="/static/images/hubspot-logo.svg"
                  alt="HubSpot"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="hubspotQuote"
              defaults="“The simplest choice for availability polling for large groups.”"
            />
          </Mention>
          <Mention
            delay={0.75}
            logo={
              <div className="relative h-8 w-32">
                <Image
                  src="/static/images/goodfirms-logo.svg"
                  alt="Goodfirms"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="goodfirmsQuote"
              defaults="“Unique in its simplicity and requires minimum interaction time.”"
            />
          </Mention>
          <Mention
            delay={1}
            logo={
              <div className="relative h-8 w-20">
                <Image
                  src="/static/images/popsci-logo.svg"
                  alt="PopSci"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="popsciQuote"
              defaults="“The perfect pick if you want to keep your RSVPs simple.”"
            />
          </Mention>
        </Mentions>
      </Section>
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
                    i18nKey="faqWhatIsRallly"
                    defaults="What is Rallly?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="faqWhatIsRalllyAnswer"
                  defaults="Rallly is a meeting scheduling tool. You create a poll with a few proposed times, share a link, and participants vote on the times that work for them. When the votes are in, you can see at a glance which time suits everyone best."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="faqNeedAccount"
                    defaults="Do I need an account to use Rallly?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="faqNeedAccountAnswer"
                  defaults="No. You can create a poll and vote on one without signing up. Creating a free account lets you manage your polls from any device and get notified when people respond."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="faqIsFree"
                    defaults="Is Rallly free?"
                  />
                }
              >
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
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="faqTimeZones"
                    defaults="Does Rallly work across time zones?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="faqTimeZonesAnswer"
                  defaults="Yes. When you create a poll with specific times, each participant sees the options in their own time zone automatically, so nobody has to do the math."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="faqAfterVoting"
                    defaults="What happens after everyone votes?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="faqAfterVotingAnswer"
                  defaults="The results show which times work for the most people. With Rallly Pro you can finalize the poll, which notifies participants of the chosen time by email."
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
                i18nKey="freeSchedulingPollFinalCtaTitle"
                defaults="Ready to create your scheduling poll?"
              />
            }
            description={
              <Trans
                t={t}
                ns="home"
                i18nKey="freeSchedulingPollFinalCtaDescription"
                defaults="It takes seconds and your group can start voting right away."
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
    title: t("freeSchedulingPollMetaTitle", {
      ns: "home",
    }),
    description: t("freeSchedulingPollMetaDescription", {
      ns: "home",
    }),
  };
}
