import Bonus from "@/components/home/bonus";
import { MarketingHero } from "@/components/home/hero";
import { BigTestimonial, Marketing, MentionedBy } from "@/components/marketing";
import { getTranslation } from "@/i18n/server";

export default async function Page({ params }: { params: { locale: string } }) {
  const { t } = await getTranslation(params.locale, ["home", "common"]);
  return (
    <Marketing>
      <MarketingHero
        title={t("headline", {
          defaultValue: "Ditch the back-and-forth emails",
          ns: "home",
        })}
        description={t("subheading", {
          defaultValue: "Streamline your scheduling process and save time",
          ns: "home",
        })}
        callToAction={t("getStarted", {
          ns: "common",
        })}
      />
      <Bonus t={t} />
      <BigTestimonial />
      <MentionedBy />
    </Marketing>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale, "home");
  return {
    title: t("metaTitle", {
      defaultValue: "Rallly: Group Scheduling Tool",
      ns: "home",
    }),
    description: t("metaDescription", {
      defaultValue:
        "Create polls and vote to find the best day or time. A free alternative to Doodle.",
    }),
  };
}
