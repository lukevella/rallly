"use cache";

import { PLAN_NAMES, pricingData } from "@rallly/billing";
import { buttonVariants } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import {
  CalendarCheckIcon,
  CalendarSearchIcon,
  ClockIcon,
  EyeOffIcon,
  LifeBuoyIcon,
  PaletteIcon,
  TimerResetIcon,
  UserPlusIcon,
} from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { AnimatedStat } from "@/components/home/animated-number";
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
import { getMonthlyPollCount, getMonthlyVoterCount } from "@/lib/data";
import { linkToApp } from "@/lib/linkToApp";

import {
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

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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
  const monthlyPrice = currencyFormatter.format(
    pricingData.monthly.amount / 100,
  );
  const yearlyMonthlyEquivalent = currencyFormatter.format(
    pricingData.yearly.amount / 100 / 12,
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
          <div className="mt-8 sm:mt-12">
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
                    i18nKey="annualBenefit"
                    defaults="{count} months free"
                    values={{ count: 4 }}
                  />
                </Badge>
              }
            />
          </div>
          <PlanCards className="mt-4 sm:mt-6">
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
                    className: "w-full sm:w-auto",
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
            <PlanCard className="md:col-span-2">
              <PlanCardHeader>
                <div className="flex items-center justify-between gap-x-4">
                  <PlanCardName>{PLAN_NAMES.PRO}</PlanCardName>
                  <Badge variant="primary">
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
              <BillingIntervalValue
                yearly={
                  <PlanCardPrice>
                    <PlanCardPriceAmount>
                      {yearlyMonthlyEquivalent}
                    </PlanCardPriceAmount>
                    <PlanCardPriceLabel>
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="perSeatMonthBilledYearly"
                        defaults="/seat/mo, billed yearly"
                      />
                    </PlanCardPriceLabel>
                  </PlanCardPrice>
                }
                monthly={
                  <PlanCardPrice>
                    <PlanCardPriceAmount>{monthlyPrice}</PlanCardPriceAmount>
                    <PlanCardPriceLabel>
                      <Trans
                        t={t}
                        ns="pricing"
                        i18nKey="perSeatMonth"
                        defaults="/seat/mo"
                      />
                    </PlanCardPriceLabel>
                  </PlanCardPrice>
                }
              />
              <div>
                <Link
                  href={linkToApp("/settings/billing")}
                  className={buttonVariants({
                    variant: "primary",
                    className: "w-full sm:w-auto",
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
                      i18nKey="featureNameSchedule"
                      defaults="Schedule poll"
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
            defaults="<b>{voterCount, plural, one {# person} other {# people}}</b> voted on <b>{pollCount, plural, one {# poll} other {# polls}}</b> in the last 30 days"
            values={{ voterCount, pollCount }}
            components={{
              b: <AnimatedStat locale={locale} />,
            }}
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
                    ns="pricing"
                    i18nKey="compareUnlimitedParticipants"
                    defaults="Unlimited participants"
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
                    ns="pricing"
                    i18nKey="comparePollRetention"
                    defaults="Poll retention"
                  />
                </CompareTableFeature>
                <CompareTableCell>
                  <Trans
                    t={t}
                    ns="pricing"
                    i18nKey="comparePollRetention30Days"
                    defaults="30 days"
                  />
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
                    i18nKey="featureNameSchedule"
                    defaults="Schedule poll"
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
    title: t("pricing", { ns: "common", defaultValue: "Pricing" }),
    description: t("pricingDescription", {
      ns: "pricing",
    }),
  };
}
