import type { Metadata } from "next";
import Bonus from "@/components/home/bonus";
import { MarketingHero } from "@/components/home/hero";
import { BigTestimonial, Marketing, MentionedBy } from "@/components/marketing";
import { getTranslation } from "@/i18n/server";

export default async function Page() {
  const { t } = await getTranslation(["home", "common"]);
  return (
    <Marketing>
      <MarketingHero
        title={t("headline", {
          defaultValue: "Find the best time to meet",
          ns: "home",
        })}
        description={t("subheading", {
          defaultValue:
            "Coordinate group meetings without the back-and-forth emails",
          ns: "home",
        })}
        callToAction={t("createAPoll", {
          ns: "home",
        })}
      />
      <Bonus />
      <BigTestimonial />
      <MentionedBy />
    </Marketing>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation("home");
  return {
    title: t("metaTitle", {
      defaultValue: "Rallly: Group Scheduling Tool",
      ns: "home",
    }),
    description: t("metaDescription", {
      ns: "home",
      defaultValue:
        "Create polls and vote to find the best day or time. A free alternative to Doodle.",
    }),
  };
}
