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
import { Hero, HeroAnnouncement } from "@/components/home/hero";
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
          title={t("doodleAlternative", {
            ns: "home",
          })}
          description={t("doodleAlternativeDescription", {
            ns: "home",
          })}
          announcement={
            <HeroAnnouncement
              href="/blog/is-doodle-still-free"
              badge={
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="isDoodleStillFreeBlogBadge"
                  defaults="New"
                />
              }
            >
              <Trans
                t={t}
                ns="home"
                i18nKey="isDoodleStillFreeBlog"
                defaults="Is Doodle still free? What changed in 2026"
              />
            </HeroAnnouncement>
          }
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
              i18nKey="doodleComparisonTitle"
              defaults="How Rallly compares to Doodle"
            />
          </SectionTitle>
          <SectionDescription>
            <Trans
              t={t}
              ns="home"
              i18nKey="doodleComparisonDescription"
              defaults="A side-by-side look at what you get with each tool."
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
                <CompareTableHead>Doodle</CompareTableHead>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="doodleComparisonPolls"
                    defaults="Group polls"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="compareUnlimited"
                    defaults="Unlimited"
                  />
                </CompareTableCell>
                <CompareTableCell>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="doodleComparisonPollsDoodle"
                    defaults="1 on the free plan"
                  />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="doodleComparisonNoAccount"
                    defaults="Create polls without an account"
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
                    i18nKey="doodleComparisonAdFree"
                    defaults="Ad-free experience"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
                <CompareTableCell>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="doodleComparisonPaidPlansOnly"
                    defaults="Paid plans only"
                  />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="doodleComparisonTimeZones"
                    defaults="Automatic time zone conversion"
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
                    i18nKey="doodleComparisonOpenSource"
                    defaults="Open-source"
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
                    i18nKey="doodleComparisonSelfHosting"
                    defaults="Self-hostable"
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
                    i18nKey="faqDoodleDifference"
                    defaults="How is Rallly different from Doodle?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="faqDoodleDifferenceAnswer"
                  defaults="Rallly gives you professional, ad-free meeting polls in a clean and easy to use interface. Participants can vote without creating an account, and if you want full control of your data you can even host Rallly on your own server."
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
                i18nKey="doodleAlternativeFinalCtaTitle"
                defaults="Ready to make the switch?"
              />
            }
            description={
              <Trans
                t={t}
                ns="home"
                i18nKey="doodleAlternativeFinalCtaDescription"
                defaults="Create your first poll in seconds and see why so many people left Doodle behind."
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
    alternates: getAlternates({ locale, path: "/best-doodle-alternative" }),
    title: t("doodleAlternativeMetaTitle", {
      ns: "home",
    }),
    description: t("doodleAlternativeMetaDescription", {
      ns: "home",
    }),
  };
}
