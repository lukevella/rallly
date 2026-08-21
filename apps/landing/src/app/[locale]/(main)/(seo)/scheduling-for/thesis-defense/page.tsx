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
          title={t("thesisDefenseTitle", {
            ns: "home",
            defaultValue: "Scheduling a thesis defense",
          })}
          description={t("thesisDefenseDescription", {
            ns: "home",
            defaultValue:
              "Line up the supervisor, the internal examiner and an external in another country without a month of email. Share one link, let each examiner mark what works in their own time zone, and confirm the slot. Free, and examiners do not need an account.",
          })}
        >
          <HeroDemo locale={locale} preset="thesisDefense" />
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
                    i18nKey="thesisDefenseFaqTimeZones"
                    defaults="How does it handle examiners in other countries?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="thesisDefenseFaqTimeZonesAnswer"
                  defaults="Each examiner sees the proposed slots in their own time zone automatically, so an external in Melbourne and a supervisor in Berlin are looking at the same slot without either of them converting anything. Nobody has to work out what a time means locally."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="thesisDefenseFaqExternal"
                    defaults="Can an external examiner respond without an account?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="thesisDefenseFaqExternalAnswer"
                  defaults="Yes. Anyone with the link can reply whether or not they use Rallly, and whichever system their own institution runs. That matters for externals, who are usually the hardest person to reach and the least likely to sign up for another tool."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="thesisDefenseFaqEveryone"
                    defaults="Everyone has to attend, not just most people. Does that work?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="thesisDefenseFaqEveryoneAnswer"
                  defaults="Yes. Every slot shows exactly who can make it and who cannot, rather than only a total, so you can find the slots where the whole panel is free and rule out the ones where a required examiner said no. If none work, you offer another round of dates."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="thesisDefenseFaqOnBehalf"
                    defaults="Can a coordinator run this on behalf of the candidate?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="thesisDefenseFaqOnBehalfAnswer"
                  defaults="Yes. Graduate school administrators often create and manage the poll themselves, so the responses come back to them and they set the final time. You can also add an examiner and fill in their availability yourself when they email their times instead of using the link."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="thesisDefenseFaqBranding"
                    defaults="Can polls carry our university branding?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="thesisDefenseFaqBrandingAnswer"
                  defaults="With <0>Rallly Pro</0> you can add your own logo and colours and remove Rallly attribution, so a poll you send to an external examiner looks like it came from your department. Everything else is free to use."
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
                i18nKey="thesisDefenseFinalCtaTitle"
                defaults="Ready to get the defense in the diary?"
              />
            }
            description={
              <Trans
                t={t}
                ns="home"
                i18nKey="thesisDefenseFinalCtaDescription"
                defaults="Set up your poll in under a minute, send one link to the panel, and stop converting time zones by hand."
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
    title: t("thesisDefenseMetaTitle", {
      ns: "home",
      defaultValue:
        "Schedule a Thesis Defense or Viva | Free Examiner Availability Poll",
    }),
    description: t("thesisDefenseMetaDescription", {
      ns: "home",
      defaultValue:
        "Rallly is a free scheduling tool for thesis defenses and vivas. Find a slot that suits every examiner across time zones with one link. No account needed.",
    }),
  };
}
