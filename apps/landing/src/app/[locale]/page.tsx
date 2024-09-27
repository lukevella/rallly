import Bonus from "@/components/home/bonus";
import { MarketingHero } from "@/components/home/hero";
import { BigTestimonial, Marketing, MentionedBy } from "@/components/marketing";
import { getTranslation } from "@/i18n/server";

export default async function Page({ params }: { params: { locale: string } }) {
  const { t } = await getTranslation(params.locale, ["common", "home"]);
  return (
    <Marketing>
      <MarketingHero
        title={t("home:headline", {
          defaultValue: "Ditch the back-and-forth emails",
        })}
        description={t("home:subheading", {
          defaultValue: "Streamline your scheduling process and save time",
        })}
        callToAction={t("getStarted")}
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
    title: t("home:metaTitle", {
      defaultValue: "Rallly: Group Scheduling Tool",
    }),
    description: t("home:metaDescription", {
      defaultValue:
        "Create polls and vote to find the best day or time. A free alternative to Doodle.",
    }),
  };
}
