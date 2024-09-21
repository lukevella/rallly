"use client";

import { useTranslation } from "react-i18next";

import Bonus from "@/components/home/bonus";
import { MarketingHero } from "@/components/home/hero";
import {
  BigTestimonial,
  Marketing,
  MentionedBy,
  UsedBy,
} from "@/components/marketing";
import { Trans } from "@/components/trans";

const Page = () => {
  const { t } = useTranslation(["home"]);
  return (
    <Marketing
      title={t("home:metaTitle", {
        defaultValue: "Rallly - Schedule Group Meetings",
      })}
      description={t("home:metaDescription", {
        defaultValue:
          "Create polls and vote to find the best day or time. A free alternative to Doodle.",
      })}
    >
      <MarketingHero
        title={t("home:headline")}
        description={t("home:subheading", {
          defaultValue: "Streamline your scheduling process and save time",
        })}
        callToAction={<Trans i18nKey="getStarted" defaults="Get started" />}
      />
      <Bonus />
      <BigTestimonial />
      <MentionedBy />
    </Marketing>
  );
};

export default Page;
