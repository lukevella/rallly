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
import { LinkBase } from "@/i18n/client/link";
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
          title={t("committeesTitle", {
            ns: "home",
            defaultValue: "Scheduling for committees and boards",
          })}
          description={t("committeesDescription", {
            ns: "home",
            defaultValue:
              "Find a date the whole committee can make without a chain of reply-all emails. Share one link, watch the responses come in, and confirm the meeting once you know you have quorum. Free, and members do not need an account.",
          })}
        >
          <HeroDemo locale={locale} preset="committee" />
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
                    i18nKey="committeesFaqAvailability"
                    defaults="How do I ask members for their availability?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="committeesFaqAvailabilityAnswer"
                  defaults="Create a <0>scheduling poll</0> with the dates you can offer and send members the link. Each member marks the dates they can make, and the responses build into a clear picture of the committee's availability without a single reply-all email."
                  components={[
                    <LinkBase
                      key="scheduling-poll"
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
                    i18nKey="committeesFaqQuorum"
                    defaults="How do I tell whether we will have quorum?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="committeesFaqQuorumAnswer"
                  defaults="Every date shows a running count of how many members can make it, alongside who said yes, who said if need be and who said no. You can see at a glance which dates clear your quorum threshold and which fall short, so you confirm the meeting knowing it can go ahead."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="committeesFaqRecurring"
                    defaults="Can I use it for a meeting we hold every term?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="committeesFaqRecurringAnswer"
                  defaults="Yes. Many committees run one poll per cycle, offering the handful of dates that suit the chair and letting members pick. Each round is its own poll, so you keep a clear record of what was offered and who responded each time."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="committeesFaqExternalMembers"
                    defaults="Can external trustees and co-opted members respond?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="committeesFaqExternalMembersAnswer"
                  defaults="Yes. Anyone with the link can reply whether or not they use Rallly, and whichever calendar system their own organization runs. There is no limit on how many members you invite, so trustees, co-opted members and advisers all respond the same way."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="committeesFaqRecord"
                    defaults="Do I get a record of who was asked?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="committeesFaqRecordAnswer"
                  defaults="The poll shows every participant and how they responded, so you have a clear record of who was invited and who replied when you come to write the minutes. You can also add a member and fill in their availability yourself if they send you their dates directly."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="committeesFaqBranding"
                    defaults="Can polls carry our organization branding?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="committeesFaqBrandingAnswer"
                  defaults="With <0>Rallly Pro</0> you can add your own logo and colours and remove Rallly attribution, so a poll you send to a board looks like it came from your organization. Everything else is free to use."
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
                i18nKey="committeesFinalCtaTitle"
                defaults="Ready to get the next meeting scheduled?"
              />
            }
            description={
              <Trans
                t={t}
                ns="home"
                i18nKey="committeesFinalCtaDescription"
                defaults="Set up your poll in under a minute, send one link to the members, and stop counting replies by hand."
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
    alternates: getAlternates({ locale, path: "/scheduling-for/committees" }),
    title: t("committeesMetaTitle", {
      ns: "home",
      defaultValue: "Scheduling for Committees and Boards",
    }),
    description: t("committeesMetaDescription", {
      ns: "home",
      defaultValue:
        "Rallly is a free scheduling tool for committees, boards and trustees. Find a date that reaches quorum with one link. No account needed to respond.",
    }),
  };
}
