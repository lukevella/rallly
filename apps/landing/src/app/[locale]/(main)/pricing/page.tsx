"use cache";

import { PLAN_NAMES, pricingData } from "@rallly/billing";
import { buttonVariants } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import {
  CalendarCheckIcon,
  CalendarSearchIcon,
  ClockIcon,
  CopyIcon,
  EyeOffIcon,
  LifeBuoyIcon,
  PaletteIcon,
  Settings2Icon,
  TimerResetIcon,
  UserPlusIcon,
} from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { PeopleBadge, PollsBadge } from "@/components/home/animated-number";
import { Cta } from "@/components/home/cta";
import { Faq, FaqItem } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
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
import { linkToApp } from "@/lib/linkToApp";

import {
  BillingIntervalPrice,
  BillingIntervalProvider,
  BillingIntervalSwitch,
  BillingIntervalValue,
} from "./billing-interval";
import {
  CompareTable,
  CompareTableCell,
  CompareTableCheck,
  CompareTableDash,
  CompareTableFeature,
  CompareTableHead,
  CompareTableTooltip,
} from "./compare-table";
import {
  PlanBenefit,
  PlanBenefitName,
  PlanBenefits,
  PlanBenefitTooltip,
  PlanCard,
  PlanCardDescription,
  PlanCardHeader,
  PlanCardName,
  PlanCardPrice,
  PlanCardPriceAmount,
  PlanCardPriceLabel,
  PlanCards,
} from "./plan-card";

const faqLinkClassName =
  "text-gray-800 underline underline-offset-2 hover:text-gray-600";

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  cacheLife("days");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, ["common", "pricing", "home"]);
  const [pollCount, voterCount] = await Promise.all([
    getMonthlyPollCount(),
    getMonthlyVoterCount(),
  ]);
  const freeMonths = Math.round(
    12 - pricingData.yearly.amount / pricingData.monthly.amount,
  );
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
          className="text-center"
          title={t("pricingTitle", {
            ns: "pricing",
            defaultValue: "Get started for free",
          })}
          description={t("pricingSubtitle", {
            ns: "pricing",
            defaultValue:
              "Upgrade to a paid plan to get access to premium features",
          })}
        />
        <BillingIntervalProvider>
          <div className="mt-8 flex justify-center sm:mt-12">
            <BillingIntervalSwitch
              switchLabel={t("payYearly", {
                ns: "pricing",
                defaultValue: "Pay yearly",
              })}
              monthlyLabel={
                <Trans
                  t={t}
                  ns="pricing"
                  i18nKey="payMonthly"
                  defaults="Pay monthly"
                />
              }
              yearlyLabel={
                <Trans
                  t={t}
                  ns="pricing"
                  i18nKey="payYearly"
                  defaults="Pay yearly"
                />
              }
              badge={
                <Badge variant="green">
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="yearlyFreeMonths"
                    defaults="{count, plural, one {# month free} other {# months free}}"
                    values={{ count: freeMonths }}
                  />
                </Badge>
              }
            />
          </div>
          <PlanCards className="mx-auto mt-4 max-w-6xl sm:mt-6">
            <PlanCard>
              <PlanCardHeader>
                <PlanCardName>{PLAN_NAMES.HOBBY}</PlanCardName>
                <PlanCardDescription>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="planFreeDescription"
                    defaults="For casual users"
                  />
                </PlanCardDescription>
              </PlanCardHeader>
              <PlanCardPrice>
                <PlanCardPriceAmount>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="planFree"
                    defaults="Free"
                  />
                </PlanCardPriceAmount>
              </PlanCardPrice>
              <div>
                <Link
                  href={linkToApp("/")}
                  className={buttonVariants({
                    className: "w-full",
                  })}
                >
                  <Trans
                    t={t}
                    ns="common"
                    i18nKey="getStarted"
                    defaults="Get started"
                  />
                </Link>
              </div>
              <PlanBenefits>
                <PlanBenefit icon={<CalendarSearchIcon />}>
                  <PlanBenefitTooltip
                    content={
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="basicPollsDescription"
                        defaults="Create simple scheduling polls"
                      />
                    }
                  >
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="basicPolls"
                      defaults="Basic polls"
                    />
                  </PlanBenefitTooltip>
                </PlanBenefit>
                <PlanBenefit icon={<TimerResetIcon />}>
                  <PlanBenefitTooltip
                    content={
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="thirtyDayPollRetentionDescription"
                        defaults="Polls are kept for 30 days after their final date"
                      />
                    }
                  >
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="thirtyDayPollRetention"
                      defaults="30 day poll retention"
                    />
                  </PlanBenefitTooltip>
                </PlanBenefit>
              </PlanBenefits>
            </PlanCard>
            <PlanCard>
              <PlanCardHeader>
                <div className="flex items-center justify-between gap-x-4">
                  <PlanCardName>{PLAN_NAMES.PRO}</PlanCardName>
                  <Badge variant="secondary">
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="recommended"
                      defaults="Recommended"
                    />
                  </Badge>
                </div>
                <PlanCardDescription>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="planProDescription"
                    defaults="For power users and professionals"
                  />
                </PlanCardDescription>
              </PlanCardHeader>
              <PlanCardPrice>
                <PlanCardPriceAmount>
                  <BillingIntervalPrice
                    monthly={pricingData.monthly.amount / 100}
                    yearly={pricingData.yearly.amount / 100 / 12}
                  />
                </PlanCardPriceAmount>
                <PlanCardPriceLabel>
                  <BillingIntervalValue
                    yearly={
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="perSeatMonthBilledYearly"
                        defaults="/seat/mo, billed yearly"
                      />
                    }
                    monthly={
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="perSeatMonth"
                        defaults="/seat/mo"
                      />
                    }
                  />
                </PlanCardPriceLabel>
              </PlanCardPrice>
              <div>
                <Link
                  href={linkToApp("/settings/billing")}
                  className={buttonVariants({
                    variant: "primary",
                    className: "w-full",
                  })}
                >
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="getPro"
                    defaults="Get Pro"
                  />
                </Link>
              </div>
              <PlanBenefits className="sm:grid-cols-2 sm:gap-x-6">
                <PlanBenefit icon={<PaletteIcon />}>
                  <PlanBenefitTooltip
                    content={
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="customBrandingDescription"
                        defaults="Show your logo and brand colors to your participants"
                      />
                    }
                  >
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="customBranding"
                      defaults="Custom branding"
                    />
                  </PlanBenefitTooltip>
                </PlanBenefit>
                <PlanBenefit icon={<EyeOffIcon />}>
                  <PlanBenefitTooltip
                    content={
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="removeAttributionBenefitDescription"
                        defaults='Hide "Powered by Rallly" from your participants'
                      />
                    }
                  >
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="removeAttribution"
                      defaults="Remove attribution"
                    />
                  </PlanBenefitTooltip>
                </PlanBenefit>
                <PlanBenefit icon={<CalendarCheckIcon />}>
                  <PlanBenefitTooltip
                    content={
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="schedulePollDescription"
                        defaults="Select a final date for your event."
                      />
                    }
                  >
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="finalizeDate"
                      defaults="Finalize date"
                    />
                  </PlanBenefitTooltip>
                </PlanBenefit>
                <PlanBenefit icon={<ClockIcon />}>
                  <PlanBenefitTooltip
                    content={
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="extendedPollLifetimeDescription"
                        defaults="Keep polls indefinitely"
                      />
                    }
                  >
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="featureNameExtendedPollLifetime"
                      defaults="Extended poll lifetime"
                    />
                  </PlanBenefitTooltip>
                </PlanBenefit>
                <PlanBenefit icon={<CopyIcon />}>
                  <PlanBenefitTooltip
                    content={
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="duplicatePollsDescription"
                        defaults="Create a new poll based on an existing one"
                      />
                    }
                  >
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="duplicatePolls"
                      defaults="Duplicate polls"
                    />
                  </PlanBenefitTooltip>
                </PlanBenefit>
                <PlanBenefit icon={<Settings2Icon />}>
                  <PlanBenefitTooltip
                    content={
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="advancedPollSettingsDescription"
                        defaults="Require participant emails, hide participant names, and hide votes"
                      />
                    }
                  >
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="advancedPollSettings"
                      defaults="Advanced poll settings"
                    />
                  </PlanBenefitTooltip>
                </PlanBenefit>
                <PlanBenefit icon={<UserPlusIcon />}>
                  <PlanBenefitName>
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="teamCollaboration"
                      defaults="Team collaboration"
                    />
                  </PlanBenefitName>
                </PlanBenefit>
                <PlanBenefit icon={<LifeBuoyIcon />}>
                  <PlanBenefitName>
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="prioritySupport"
                      defaults="Priority support"
                    />
                  </PlanBenefitName>
                </PlanBenefit>
              </PlanBenefits>
            </PlanCard>
          </PlanCards>
        </BillingIntervalProvider>
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
      <Section>
        <SectionHeading>
          <SectionTitle>
            <Trans
              t={t}
              ns="pricing"
              i18nKey="comparePlans"
              defaults="Compare plans"
            />
          </SectionTitle>
          <SectionDescription>
            <Trans
              t={t}
              ns="pricing"
              i18nKey="comparePlansDescription"
              defaults="See what's included in each plan."
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
                <CompareTableHead>{PLAN_NAMES.HOBBY}</CompareTableHead>
                <CompareTableHead>{PLAN_NAMES.PRO}</CompareTableHead>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="compareSchedulingPolls"
                    defaults="Scheduling polls"
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
                    ns="pricing"
                    i18nKey="compareUnlimited"
                    defaults="Unlimited"
                  />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="compareParticipants"
                    defaults="Participants"
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
                    ns="pricing"
                    i18nKey="compareUnlimited"
                    defaults="Unlimited"
                  />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="comparePollRetention"
                    defaults="Poll retention"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableTooltip
                    content={
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="thirtyDayPollRetentionDescription"
                        defaults="Polls are kept for 30 days after their final date"
                      />
                    }
                  >
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="comparePollRetention30Days"
                      defaults="30 days"
                    />
                  </CompareTableTooltip>
                </CompareTableCell>
                <CompareTableCell>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="comparePollRetentionIndefinite"
                    defaults="Indefinite"
                  />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="finalizeDate"
                    defaults="Finalize date"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="duplicatePolls"
                    defaults="Duplicate polls"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <CompareTableTooltip
                    content={
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="advancedPollSettingsDescription"
                        defaults="Require participant emails, hide participant names, and hide votes"
                      />
                    }
                  >
                    <Trans
                      t={t}
                      ns="pricing"
                      i18nKey="advancedPollSettings"
                      defaults="Advanced poll settings"
                    />
                  </CompareTableTooltip>
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="customBranding"
                    defaults="Custom branding"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="removeAttribution"
                    defaults="Remove attribution"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="teamCollaboration"
                    defaults="Team collaboration"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
              </tr>
              <tr>
                <CompareTableFeature>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="prioritySupport"
                    defaults="Priority support"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <CompareTableDash label={notIncluded} />
                </CompareTableCell>
                <CompareTableCell>
                  <CompareTableCheck label={included} />
                </CompareTableCell>
              </tr>
            </tbody>
          </CompareTable>
        </SectionContent>
      </Section>
      <div>
        <Section>
          <SectionHeading>
            <SectionTitle>
              <Trans
                t={t}
                ns="pricing"
                i18nKey="faq"
                defaults="Frequently asked questions"
              />
            </SectionTitle>
            <SectionDescription>
              <Trans
                t={t}
                ns="pricing"
                i18nKey="pricingFaqDescription"
                defaults="Everything you need to know about our plans and billing."
              />
            </SectionDescription>
          </SectionHeading>
          <SectionContent>
            <Faq>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="canUseFree"
                    defaults="Can I use Rallly for free?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="pricing"
                  i18nKey="canUseFreeAnswer2"
                  defaults="Yes, most of Rallly's features are free and many users will never need to pay for anything. However, there are some features that are only available to paying customers. These features are designed to help you get the most out of Rallly."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="whyUpgrade"
                    defaults="Why should I upgrade?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="pricing"
                  i18nKey="whyUpgradeAnswer2"
                  defaults="Upgrading to a paid plan makes sense if you use Rallly often or use it for work. The current subscription rate is a special early adopter rate and will increase in the future. By upgrading now, you will get early access to new, high-quality scheduling tools as they are released and lock in your subscription rate so you won't be affected by future price increases."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="whenPollInactive"
                    defaults="When does a poll become inactive?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="pricing"
                  i18nKey="whenPollInactiveAnswer"
                  defaults="Polls become inactive when all date options are in the past AND there has been no activity for over 30 days. Activity includes new votes, comments, or changes to the poll. Inactive polls are automatically deleted if you do not have a paid subscription."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="howToUpgrade"
                    defaults="How do I upgrade to a paid plan?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="pricing"
                  i18nKey="howToUpgradeAnswer"
                  components={{
                    a: (
                      <Link
                        className={faqLinkClassName}
                        href={linkToApp("/settings/billing")}
                      />
                    ),
                    b: <strong />,
                  }}
                  defaults="To upgrade, you can go to your <a>billing settings</a> and click on <b>Upgrade</b>."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="cancelSubscription"
                    defaults="How do I cancel my subscription?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="pricing"
                  i18nKey="cancelSubscriptionAnswer"
                  components={{
                    a: (
                      <Link
                        className={faqLinkClassName}
                        href={linkToApp("/settings/billing")}
                      />
                    ),
                    b: <strong />,
                  }}
                  defaults="You can cancel your subscription at any time by going to your <a>billing settings</a>. Once you cancel your subscription, you will still have access to your paid plan until the end of your billing period. After that, you will be downgraded to a free plan."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="faqNonprofit"
                    defaults="Do you offer discounts for nonprofits?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="faqNonprofitAnswer"
                  defaults="Yes. We offer discounted Rallly Pro subscriptions for registered nonprofits. Email us at <0>support@rallly.co</0> and we will get you set up."
                  components={[
                    <a
                      key="email"
                      className={faqLinkClassName}
                      href="mailto:support@rallly.co"
                    />,
                  ]}
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="faqTeams"
                    defaults="How does Rallly work for teams?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="faqTeamsAnswer"
                  defaults="You can invite your team into a shared space where everyone creates and manages polls together. Billing is centralized. A single subscription covers the whole team, and you can add or remove seats as your team changes."
                />
              </FaqItem>
              <FaqItem
                question={
                  <Trans
                    t={t}
                    ns="home"
                    i18nKey="faqSelfHost"
                    defaults="Can I self-host Rallly?"
                  />
                }
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="faqSelfHostAnswer"
                  defaults="Yes. Rallly is open source and can be deployed on your own infrastructure with Docker. Check the <0>self-hosting docs</0> to get started."
                  components={[
                    <a
                      key="docs"
                      className={faqLinkClassName}
                      href="https://support.rallly.co/self-hosting/installation/docker"
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
                ns="pricing"
                i18nKey="pricingFinalCtaTitle"
                defaults="Try Rallly for free"
              />
            }
            description={
              <Trans
                t={t}
                ns="pricing"
                i18nKey="pricingFinalCtaDescription"
                defaults="Create your first poll in under a minute. Upgrade when you need more."
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
}) {
  cacheLife("max");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, ["common", "pricing"]);
  return {
    alternates: getAlternates({ locale, path: "/pricing" }),
    title: t("pricing", { ns: "common", defaultValue: "Pricing" }),
    description: t("pricingDescription", {
      ns: "pricing",
    }),
  };
}
