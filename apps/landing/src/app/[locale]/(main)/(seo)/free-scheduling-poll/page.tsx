"use cache";

import { CalendarIcon, ClockIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";
import {
  ContentGrid,
  ContentGridDescription,
  ContentGridItem,
  ContentGridTitle,
} from "@/components/content-grid";
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
              <PeopleBadge key="people" locale={locale} live />,
              <PollsBadge key="polls" locale={locale} live />,
            ]}
          />
        </Stats>
      </Section>
      <HowItWorks locale={locale} />
      <SocialProof locale={locale} />
      <Section>
        <SectionHeading>
          <SectionTitle>
            <Trans
              t={t}
              ns="home"
              i18nKey="freeSchedulingPollUseCasesTitle"
              defaults="Use it as a meeting poll, availability poll, or calendar poll"
            />
          </SectionTitle>
          <SectionDescription>
            <Trans
              t={t}
              ns="home"
              i18nKey="freeSchedulingPollUseCasesDescription"
              defaults="The same simple poll adapts to how you schedule. Offer a shortlist of times, collect availability across a wider range, or put whole dates to a vote."
            />
          </SectionDescription>
        </SectionHeading>
        <SectionContent>
          <ContentGrid>
            <ContentGridItem>
              <ContentGridTitle>
                <ClockIcon />
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="freeSchedulingPollMeetingPollTitle"
                  defaults="Meeting poll"
                />
              </ContentGridTitle>
              <ContentGridDescription>
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="freeSchedulingPollMeetingPollDescription"
                  defaults="Propose a shortlist of times and let participants vote. The best meeting time shows at a glance."
                />
              </ContentGridDescription>
            </ContentGridItem>
            <ContentGridItem>
              <ContentGridTitle>
                <UsersIcon />
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="freeSchedulingPollAvailabilityPollTitle"
                  defaults="Availability poll"
                />
              </ContentGridTitle>
              <ContentGridDescription>
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="freeSchedulingPollAvailabilityPollDescription"
                  defaults="Not sure when everyone is free? Offer a wider range of times and each person answers yes, no, or if need be."
                />
              </ContentGridDescription>
            </ContentGridItem>
            <ContentGridItem>
              <ContentGridTitle>
                <CalendarIcon />
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="freeSchedulingPollCalendarPollTitle"
                  defaults="Calendar poll"
                />
              </ContentGridTitle>
              <ContentGridDescription>
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="freeSchedulingPollCalendarPollDescription"
                  defaults="Scheduling an event? Offer whole dates on a calendar and find the day that suits the most people."
                />
              </ContentGridDescription>
            </ContentGridItem>
          </ContentGrid>
        </SectionContent>
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
                    i18nKey="freeSchedulingPollFaqWhatIs"
                    defaults="What is a scheduling poll?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="freeSchedulingPollFaqWhatIsAnswer"
                  defaults="A scheduling poll is a quick way to find the best time for a group to meet. You propose a few times, participants vote on the ones that work for them, and the most popular option wins. People also call it a meeting poll, an availability poll, or a calendar poll, depending on how they use it."
                />
              </FaqItem>
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
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="freeSchedulingPollFaqMeetingTimes"
                    defaults="How do I create a poll for meeting times?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="freeSchedulingPollFaqMeetingTimesAnswer"
                  defaults="Pick a few times that could work, give the poll a title, and share the link with your group. Participants vote on the meeting times that suit them without creating an account, and you can see the winning time as the responses come in."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="freeSchedulingPollFaqEveryoneFree"
                    defaults="How do I find out when everyone is free?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="freeSchedulingPollFaqEveryoneFreeAnswer"
                  defaults="Use your poll as an availability poll. Offer a wider set of dates or times and ask everyone to respond with yes, no, or if need be. The results give you a clear picture of the group's availability, so you can pick a time that works for everyone."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="freeSchedulingPollFaqMeetingVsAvailability"
                    defaults="What is the difference between a meeting poll and an availability poll?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="freeSchedulingPollFaqMeetingVsAvailabilityAnswer"
                  defaults="A meeting poll asks people to choose between a few proposed times, while an availability poll collects when everyone is free before you decide. Rallly handles both. Offer a shortlist when you already have one, or a broad set of options when you want to see the group's availability first."
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
    alternates: getAlternates({ locale, path: "/free-scheduling-poll" }),
    title: t("freeSchedulingPollMetaTitle", {
      ns: "home",
      defaultValue: "Create a Free Scheduling Poll Instantly",
    }),
    description: t("freeSchedulingPollMetaDescription", {
      ns: "home",
      defaultValue:
        "Create a free scheduling poll in seconds. Propose times, share a link, and see when everyone is free. Works as a meeting poll, availability poll, or calendar poll.",
    }),
  };
}
