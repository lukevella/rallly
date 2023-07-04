import { CheckIcon } from "@rallly/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@rallly/ui/accordion";
import {
  BillingPlan,
  BillingPlanDescription,
  BillingPlanHeader,
  BillingPlanPerk,
  BillingPlanPerks,
  BillingPlanPrice,
  BillingPlanTitle,
} from "@rallly/ui/billing-plan";
import { Label } from "@rallly/ui/label";
import { Switch } from "@rallly/ui/switch";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { NextSeo } from "next-seo";
import React from "react";

import { getPageLayout } from "@/components/layouts/page-layout";
import { Trans } from "@/components/trans";
import { NextPageWithLayout } from "@/types";
import { getStaticTranslations } from "@/utils/page-translations";

const Perk = ({ children }: React.PropsWithChildren) => {
  return (
    <li className="flex">
      <CheckIcon className="mr-2 inline h-4 w-4 translate-y-0.5 -translate-x-0.5 text-green-600" />
      <span>{children}</span>
    </li>
  );
};

const monthlyPriceUsd = 5;
const annualPriceUsd = 30;

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const [annualBilling, setAnnualBilling] = React.useState(true);
  return (
    <div className="mx-auto max-w-2xl bg-gray-100">
      <NextSeo title={t("pricing", { defaultValue: "Pricing" })} />
      <h1 className="mb-4 text-4xl font-bold tracking-tight">
        <Trans i18nKey="pricing">Pricing</Trans>
      </h1>
      <p className="text-muted-foreground text-lg">
        <Trans
          i18nKey="pricingDescription"
          defaults="Get started for free. No login required."
        />
      </p>
      <div className="mt-8 mb-8">
        <div className="mb-4 flex items-center gap-x-2">
          <Switch
            id="annual-billing"
            checked={annualBilling}
            onCheckedChange={setAnnualBilling}
          />
          <Label htmlFor="annual-billing">
            <Trans
              i18nKey="annualBilling"
              values={{ discount: 50 }}
              defaults="Annual billing (Save {discount}%)"
            />
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <BillingPlan>
            <BillingPlanHeader>
              <BillingPlanTitle>
                <Trans i18nKey="planFree" defaults="Free" />
              </BillingPlanTitle>
              <BillingPlanPrice>$0</BillingPlanPrice>
              <BillingPlanDescription>
                <Trans i18nKey="freeForever" defaults="free forever" />
              </BillingPlanDescription>
            </BillingPlanHeader>
            <BillingPlanPerks>
              <BillingPlanPerk>
                <Trans
                  i18nKey="plan_unlimitedPolls"
                  defaults="Unlimited polls"
                />
              </BillingPlanPerk>
              <BillingPlanPerk>
                <Trans
                  i18nKey="plan_unlimitedParticipants"
                  defaults="Unlimited participants"
                />
              </BillingPlanPerk>
            </BillingPlanPerks>
          </BillingPlan>
          <BillingPlan variant="primary">
            <BillingPlanHeader>
              <BillingPlanTitle className="text-primary">
                <Trans i18nKey="planPro" defaults="Pro" />
              </BillingPlanTitle>
              {annualBilling ? (
                <>
                  <BillingPlanPrice
                    discount={`$${(annualPriceUsd / 12).toFixed(2)}`}
                  >
                    ${monthlyPriceUsd}
                  </BillingPlanPrice>
                  <BillingPlanDescription>
                    <Trans
                      i18nKey="annualBillingDescription"
                      defaults="per month, billed annually"
                    />
                  </BillingPlanDescription>
                </>
              ) : (
                <>
                  <BillingPlanPrice>${monthlyPriceUsd}</BillingPlanPrice>
                  <BillingPlanDescription>
                    <Trans
                      i18nKey="monthlyBillingDescription"
                      defaults="per month"
                    />
                  </BillingPlanDescription>
                </>
              )}
            </BillingPlanHeader>
            <BillingPlanPerks>
              <BillingPlanPerk>
                <Trans
                  i18nKey="plan_unlimitedPolls"
                  defaults="Unlimited polls"
                />
              </BillingPlanPerk>
              <BillingPlanPerk>
                <Trans
                  i18nKey="plan_unlimitedParticipants"
                  defaults="Unlimited participants"
                />
              </BillingPlanPerk>
              <Perk>
                <Trans i18nKey="plan_finalizePolls" defaults="Finalize polls" />
              </Perk>
              <BillingPlanPerk>
                <Trans
                  i18nKey="plan_extendedPollLife"
                  defaults="Extended poll life"
                />
              </BillingPlanPerk>
              <BillingPlanPerk>
                <Trans
                  i18nKey="plan_prioritySupport"
                  defaults="Priority support"
                />
              </BillingPlanPerk>
            </BillingPlanPerks>
          </BillingPlan>
        </div>
      </div>
      <h2>
        <Trans i18nKey="faq" defaults="Frequently Asked Questions"></Trans>
      </h2>
      <Accordion type="multiple">
        <AccordionItem value="how-to-upgrade">
          <AccordionTrigger>
            <Trans
              i18nKey="faq_howToUpgrade"
              defaults="How do I upgrade to a paid plan?"
            ></Trans>
          </AccordionTrigger>
          <AccordionContent>
            <Trans
              i18nKey="faq_howToUpgradeAnswer"
              components={{
                a: (
                  <Link
                    className="text-link"
                    href="https://app.rallly.co/settings/billing"
                  />
                ),
                b: <strong />,
              }}
              defaults="To upgrade, you can go to your <a>billing settings</a> and click on <b>Upgrade</b>."
            ></Trans>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

Page.getLayout = getPageLayout;

export default Page;

export const getStaticProps = getStaticTranslations;
