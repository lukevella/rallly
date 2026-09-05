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
          title={t("sportsClubsTitle", {
            ns: "home",
            defaultValue: "Scheduling for sports clubs and teams",
          })}
          description={t("sportsClubsDescription", {
            ns: "home",
            defaultValue:
              "Find out which nights your squad can actually make. Share one link with players, parents and coaches, see the numbers for every session, and book the pitch once. Free, with no limit on how many people you ask.",
          })}
        >
          <HeroDemo locale={locale} preset="sportsClub" />
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
                    i18nKey="sportsClubsFaqSquadSize"
                    defaults="How many players can I include?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="sportsClubsFaqSquadSizeAnswer"
                  defaults="There is no limit on how many people you invite, so a full squad, the coaching staff and reserves can all respond to the same poll. Every session shows a running count, so you can see immediately which nights you have the numbers for."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="sportsClubsFaqParents"
                    defaults="Can parents respond on behalf of their child?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="sportsClubsFaqParentsAnswer"
                  defaults="Yes. Whoever opens the link enters a name and marks the sessions, so a parent can reply for their child, and one parent can respond for siblings by adding each of them separately. Nobody needs an account or an email address to take part."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="sportsClubsFaqNoApp"
                    defaults="Do players need to download an app or sign up?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="sportsClubsFaqNoAppAnswer"
                  defaults="No. Anyone with the link can respond straight from their phone browser, which matters when you are sharing it into a team group chat. Only you, as the organizer, need an account, and creating one is free."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="sportsClubsFaqRepeat"
                    defaults="Can I reuse it for next season or the next block?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="sportsClubsFaqRepeatAnswer"
                  defaults="Yes. Most clubs run a fresh poll for each block of sessions, offering the dates the pitch or hall is available and letting the squad pick. Each block is its own poll, so last season's replies never get confused with this one."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="sportsClubsFaqBranding"
                    defaults="Can polls carry our club badge?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="sportsClubsFaqBrandingAnswer"
                  defaults="With <0>Rallly Pro</0> you can add your own logo and colours and remove Rallly attribution, so a poll you send out looks like it came from the club. Everything else is free to use."
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
                i18nKey="sportsClubsFinalCtaTitle"
                defaults="Ready to sort out the training schedule?"
              />
            }
            description={
              <Trans
                t={t}
                ns="home"
                i18nKey="sportsClubsFinalCtaDescription"
                defaults="Set up your poll in under a minute, send one link to the squad, and stop chasing replies in the group chat."
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
    alternates: getAlternates({ locale, path: "/scheduling-for/sports-clubs" }),
    title: t("sportsClubsMetaTitle", {
      ns: "home",
      defaultValue: "Scheduling for Sports Clubs and Teams",
    }),
    description: t("sportsClubsMetaDescription", {
      ns: "home",
      defaultValue:
        "Rallly is a free scheduling tool for sports clubs, teams and coaches. Check squad availability for training and fixtures with one link. No account needed.",
    }),
  };
}
