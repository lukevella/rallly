"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";
import { PeopleBadge, PollsBadge } from "@/components/home/animated-number";
import { Cta } from "@/components/home/cta";
import { Faq, FaqItem } from "@/components/home/faq";
import { Hero, HeroAnnouncement } from "@/components/home/hero";
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
          title={t("eaTitle", {
            ns: "home",
            defaultValue: "Scheduling for executive assistants",
          })}
          description={t("eaDescription", {
            ns: "home",
            defaultValue:
              "Find a time that works across a dozen busy calendars without a single follow-up email. Share one link, watch the responses land, and lock in the slot everyone can make. Free, and nobody you invite needs an account.",
          })}
          announcement={
            <HeroAnnouncement
              href="/blog/mobile-voting-redesign"
              badge={
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="mobileVotingBlogBadge"
                  defaults="New"
                />
              }
            >
              <Trans
                t={t}
                ns="home"
                i18nKey="mobileVotingBlog"
                defaults="A clearer way to vote on your phone"
              />
            </HeroAnnouncement>
          }
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
                    defaults="Can I schedule on behalf of an executive?"
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
    title: t("eaMetaTitle", {
      ns: "home",
      defaultValue:
        "Scheduling for Executive Assistants | Free Meeting Poll Tool",
    }),
    description: t("eaMetaDescription", {
      ns: "home",
      defaultValue:
        "Rallly is a free scheduling tool for executive assistants. Coordinate meetings across busy calendars and time zones with one link. No account needed to respond.",
    }),
  };
}
