"use cache";

import { Grid3x3Icon, MousePointerClickIcon } from "lucide-react";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Trans } from "react-i18next/TransWithoutContext";
import {
  CompareTable,
  CompareTableCell,
  CompareTableCheck,
  CompareTableDash,
  CompareTableFeature,
  CompareTableHead,
} from "@/components/compare-table";
import {
  ContentGrid,
  ContentGridDescription,
  ContentGridItem,
  ContentGridTitle,
} from "@/components/content-grid";
import { PeopleBadge, PollsBadge } from "@/components/home/animated-number";
import { Cta } from "@/components/home/cta";
import { FaqItem, FaqSection } from "@/components/home/faq";
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
import { LinkBase } from "@/i18n/client/link";
import { getTranslation } from "@/i18n/server";
import { getAlternates } from "@/lib/alternates";
import { getMonthlyPollCount, getMonthlyVoterCount } from "@/lib/data";

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  cacheLife("hours");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, ["home", "pricing"]);
  const [pollCount, voterCount] = await Promise.all([
    getMonthlyPollCount(),
    getMonthlyVoterCount(),
  ]);
  const included = t("included", {
    ns: "pricing",
    defaultValue: "Included",
  });
  const notIncluded = t("notIncluded", {
    ns: "pricing",
    defaultValue: "Not included",
  });
  return (
    <div className="divide-y">
      <Section>
        <Hero
          wideDescription
          title={t("when2meetAlternative", {
            ns: "home",
            defaultValue: "A modern When2meet alternative",
          })}
          description={t("when2meetAlternativeDescription", {
            ns: "home",
            defaultValue:
              "When2meet asks everyone to paint their free time onto a grid. Rallly turns that around: you propose a few times, participants tap yes, no, or if need be, and the best time shows at a glance. You get an email when someone responds, and you can finalize with a calendar invite. Free, no ads, and no account needed to vote.",
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
      <Section>
        <SectionHeading>
          <SectionTitle>
            <Trans
              t={t}
              ns="home"
              i18nKey="when2meetGridVsTapTitle"
              defaults="Painting a grid vs tapping a time"
            />
          </SectionTitle>
          <SectionDescription>
            <Trans
              t={t}
              ns="home"
              i18nKey="when2meetGridVsTapDescription"
              defaults="Both tools find a time a group can meet. The difference is in what you ask participants to do."
            />
          </SectionDescription>
        </SectionHeading>
        <SectionContent>
          <ContentGrid className="lg:grid-cols-2">
            <ContentGridItem>
              <ContentGridTitle>
                <Grid3x3Icon />
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="when2meetGridVsTapWhen2meetTitle"
                  defaults="How When2meet works"
                />
              </ContentGridTitle>
              <ContentGridDescription>
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="when2meetGridVsTapWhen2meetDescription"
                  defaults="You name an event, pick the dates and a time range, and share the link. Each person signs in with a name, then clicks and drags across a grid of time slots to mark when they are free. The cells where the most people overlap turn darker, and you read the result off the grid. Nobody is told when a response comes in, and the event has no final time, only the shading."
                />
              </ContentGridDescription>
            </ContentGridItem>
            <ContentGridItem>
              <ContentGridTitle>
                <MousePointerClickIcon />
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="when2meetGridVsTapRalllyTitle"
                  defaults="How Rallly works"
                />
              </ContentGridTitle>
              <ContentGridDescription>
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="when2meetGridVsTapRalllyDescription"
                  defaults="You propose the dates or times that could work and share the link. Each person taps yes, no, or if need be on each option, which takes seconds on a phone. You see the votes line up as they arrive and get an email for each response. When you are ready, you finalize a time and everyone gets a calendar invite."
                />
              </ContentGridDescription>
            </ContentGridItem>
          </ContentGrid>
        </SectionContent>
      </Section>
      <Section>
        <SectionHeading>
          <SectionTitle>
            <Trans
              t={t}
              ns="home"
              i18nKey="when2meetComparisonTitle"
              defaults="When2meet vs Rallly"
            />
          </SectionTitle>
          <SectionDescription>
            <Trans
              t={t}
              ns="home"
              i18nKey="when2meetComparisonDescription"
              defaults="When2meet is free and does the basics well. Here is what you get on top when you switch to Rallly."
            />
          </SectionDescription>
        </SectionHeading>
        <SectionContent>
          <CompareTable>
            <thead>
              <tr className="border-b">
                <th className="w-3/5">
                  <span className="sr-only">
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="compareFeature"
                      defaults="Feature"
                    />
                  </span>
                </th>
                <CompareTableHead>Rallly</CompareTableHead>
                <CompareTableHead>When2meet</CompareTableHead>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="when2meetComparisonFree"
                    defaults="Free to use"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="when2meetComparisonNoAccount"
                    defaults="Vote without creating an account"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="when2meetComparisonAdFree"
                    defaults="Ad-free experience"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="when2meetComparisonMobile"
                    defaults="Easy voting on mobile"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="when2meetComparisonNotifications"
                    defaults="Email notifications when people respond"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="when2meetComparisonComments"
                    defaults="Optional comments from participants"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="when2meetComparisonFinalize"
                    defaults="Finalize a time and notify everyone"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="when2meetComparisonManage"
                    defaults="Manage all your polls in one place"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="when2meetComparisonOpenSource"
                    defaults="Open-source and self-hostable"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
              </tr>
            </tbody>
          </CompareTable>
          <p className="mt-4 text-gray-500 text-sm">
            <Trans
              t={t}
              ns="home"
              i18nKey="when2meetComparisonCheckedOn"
              defaults="When2meet details checked on when2meet.com on 14 October 2026."
            />
          </p>
        </SectionContent>
      </Section>
      <SocialProof locale={locale} />
      <div className="divide-y">
        <FaqSection
          locale={locale}
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="faqTitle"
              defaults="Frequently asked questions"
            />
          }
        >
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
                i18nKey="faqWhen2meetDifference"
                defaults="How is Rallly different from When2meet?"
              />
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="faqWhen2meetDifferenceAnswer"
              defaults="When2meet asks everyone to paint their availability on a grid, which can be fiddly, especially on a phone. Rallly keeps it simple: you suggest times, participants vote with a tap, and you get notified as responses come in. You can turn on comments so participants can explain their answers, and when the votes are in you finalize a time so everyone knows what was decided."
            />
          </FaqItem>
          <FaqItem
            question={
              <Trans
                t={t}
                ns="home"
                i18nKey="faqWhen2meetAds"
                defaults="Does When2meet show ads?"
              />
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="faqWhen2meetAdsAnswer"
              defaults="Yes. When2meet runs Google ads on its pages, so organizers and participants both see them (checked on 14 October 2026). Rallly shows no ads on any plan, free or paid."
            />
          </FaqItem>
          <FaqItem
            question={
              <Trans
                t={t}
                ns="home"
                i18nKey="faqWhen2meetSwitch"
                defaults="How do I move an existing When2meet event to Rallly?"
              />
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="faqWhen2meetSwitchAnswer"
              defaults="There is no import, but you do not need one. Create a Rallly poll with the same dates or times, which takes about a minute, and send the new link to your group. Anyone who already answered on When2meet can tap their times again without creating an account."
            />
          </FaqItem>
          <FaqItem
            question={
              <Trans
                t={t}
                ns="home"
                i18nKey="faqWhen2meetFree"
                defaults="Is When2meet free?"
              />
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="faqWhen2meetFreeAnswer"
              defaults="Yes, When2meet is free, and if all you need is a quick availability grid it works fine. Rallly is also free, without the ads, and adds the parts When2meet leaves out: an interface that works well on mobile, email notifications when people respond, comments, and a dashboard to manage all your polls."
            />
          </FaqItem>
          <FaqItem
            question={
              <Trans
                t={t}
                ns="home"
                i18nKey="faqWhen2meetMobile"
                defaults="Does Rallly work well on mobile?"
              />
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="faqWhen2meetMobileAnswer"
              defaults="Yes. Voting on a Rallly poll is a matter of tapping the times that work for you, so it feels natural on a phone. There is no drag-select grid to wrestle with on a small screen."
            />
          </FaqItem>
          <FaqItem
            question={
              <Trans
                t={t}
                ns="home"
                i18nKey="when2meetAlternativeFaqAvailability"
                defaults="Can I use Rallly to see when everyone is available?"
              />
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="when2meetAlternativeFaqAvailabilityAnswer"
              defaults="Yes. Like When2meet, Rallly works as an <0>availability poll</0>. Offer the times you want to compare and participants respond with yes, no, or if need be, so you can see at a glance when everyone is free."
              components={[
                <LinkBase
                  key="availability-poll"
                  className="text-gray-800 underline underline-offset-2 hover:text-gray-600"
                  href="/free-scheduling-poll"
                />,
              ]}
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
                <LinkBase
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
              defaults="The results show which times work for the most people. Finalize the poll to lock in the chosen time and notify participants by email with a calendar invite."
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
                <LinkBase
                  key="privacy"
                  className="text-gray-800 underline underline-offset-2 hover:text-gray-600"
                  href="/privacy-policy"
                />,
              ]}
            />
          </FaqItem>
        </FaqSection>
        <Section className="sm:py-24">
          <Cta
            title={
              <Trans
                t={t}
                ns="home"
                i18nKey="when2meetAlternativeFinalCtaTitle"
                defaults="Ready for a fresh take on When2meet?"
              />
            }
            description={
              <Trans
                t={t}
                ns="home"
                i18nKey="when2meetAlternativeFinalCtaDescription"
                defaults="Create a poll in seconds and enjoy a cleaner way to find a time that works."
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
    alternates: getAlternates({ locale, path: "/when2meet-alternative" }),
    title: {
      absolute: t("when2meetAlternativeMetaTitle", {
        ns: "home",
        defaultValue:
          "When2meet Alternative: Free Meeting Poll, No Ads | Rallly",
      }),
    },
    description: t("when2meetAlternativeMetaDescription", {
      ns: "home",
      defaultValue:
        "A free, ad free When2meet alternative that works on your phone. Propose times, participants tap to vote, then finalize with a calendar invite. No account needed.",
    }),
  };
}
