import { Cta } from "@/components/home/cta";
import { CtaLabel } from "@/components/home/cta-label";
import { Hero } from "@/components/home/hero";
import { Mentions } from "@/components/home/mentions";
import { Stats } from "@/components/home/stats";
import { Testimonial } from "@/components/home/testimonial";
import { getTranslation } from "@/i18n/server";

export async function HomePage({
  locale,
  ctaVariant,
}: {
  locale: string;
  ctaVariant?: "control" | "create-free-poll";
}) {
  const { t } = await getTranslation(locale, ["home", "common"]);
  return (
    <div className="divide-y">
      <Hero
        locale={locale}
        title={t("headline", {
          defaultValue: "Find the best time to meet",
          ns: "home",
        })}
        description={t("subheading", {
          defaultValue:
            "Create a poll, share the link, and let everyone vote on the times that work. It's free and nobody needs an account.",
          ns: "home",
        })}
      />
      <Stats locale={locale} />
      <Testimonial locale={locale} />
      <Mentions locale={locale} />
      <Cta locale={locale} callToAction={<CtaLabel variant={ctaVariant} />} />
    </div>
  );
}
