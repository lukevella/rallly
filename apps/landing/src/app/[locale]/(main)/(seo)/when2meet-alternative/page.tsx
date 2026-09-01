"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";
import {
  CompareTable,
  CompareTableCell,
  CompareTableCheck,
  CompareTableDash,
  CompareTableFeature,
  CompareTableHead,
} from "@/components/compare-table";
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
          title={t("when2meetAlternative", {
            ns: "home",
            defaultValue: "A modern When2meet alternative",
          })}
          description={t("when2meetAlternativeDescription", {
            ns: "home",
            defaultValue:
              "Rallly does everything you use When2meet for, without the clunky parts. Participants vote with a tap instead of dragging over a grid, you get notified when responses come in, and all your polls live in one place. Free, no ads, and no account needed to vote.",
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
                    defaults="Comments from participants"
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
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="when2meetComparisonWithPro"
                    defaults="With Rallly Pro"
                  />
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
        </SectionContent>
      </Section>
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
                  defaults="When2meet asks everyone to paint their availability on a grid, which can be fiddly, especially on a phone. Rallly keeps it simple: you suggest times, participants vote with a tap, and you get notified as responses come in. Participants can leave comments, and when the votes are in you can confirm a final time so everyone knows what was decided."
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
    title: t("when2meetAlternativeMetaTitle", {
      ns: "home",
      defaultValue: "Best Free When2meet Alternative | Rallly",
    }),
    description: t("when2meetAlternativeMetaDescription", {
      ns: "home",
      defaultValue:
        "Rallly is a free When2meet alternative with a clean interface, great mobile support, response notifications, and no ads. No account needed to vote.",
    }),
  };
}
