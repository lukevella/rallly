"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Trans } from "react-i18next/TransWithoutContext";
import { Faq } from "@/components/faq";
import Bonus from "@/components/home/bonus";
import { MarketingHero } from "@/components/home/hero";
import { BigTestimonial, Marketing, MentionedBy } from "@/components/marketing";
import { getTranslation } from "@/i18n/server";

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  cacheLife("max");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, ["home"]);
  const faqItems = [
    {
      question: t("doodleAlternativeFaqIsDoodleFreeQuestion", {
        ns: "home",
        defaultValue: "Is Doodle still free?",
      }),
      answer: t("doodleAlternativeFaqIsDoodleFreeAnswer", {
        ns: "home",
        defaultValue:
          "Doodle still offers a free plan, but it has become much more limited over the years. Free users see ads and many features are locked behind a paid subscription, which is why many people are looking for an alternative.",
      }),
    },
    {
      question: t("doodleAlternativeFaqFreeAlternativeQuestion", {
        ns: "home",
        defaultValue: "Is there a free alternative to Doodle?",
      }),
      answer: t("doodleAlternativeFaqFreeAlternativeAnswer", {
        ns: "home",
        defaultValue:
          "Yes. Rallly is a free alternative to Doodle. You can create a meeting poll in seconds and share it with your participants, who can vote without creating an account and without seeing any ads.",
      }),
    },
    {
      question: t("doodleAlternativeFaqBestAlternativeQuestion", {
        ns: "home",
        defaultValue: "What is the best free Doodle alternative?",
      }),
      answer: t("doodleAlternativeFaqBestAlternativeAnswer", {
        ns: "home",
        defaultValue:
          "Rallly is one of the best free Doodle alternatives. It focuses on doing one thing well: finding the best time for a group to meet. It is fast, easy to use and does not clutter your screen with ads or upsells.",
      }),
    },
    {
      question: t("doodleAlternativeFaqOpenSourceQuestion", {
        ns: "home",
        defaultValue: "Is there an open source Doodle alternative?",
      }),
      answer: t("doodleAlternativeFaqOpenSourceAnswer", {
        ns: "home",
        defaultValue:
          "Yes. Rallly is open source and licensed under AGPLv3. You can inspect the code on GitHub and host it on your own server, giving you full control over your data.",
      }),
    },
  ];
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  return (
    <Marketing>
      <MarketingHero
        title={t("doodleAlternative", {
          ns: "home",
        })}
        description={t("doodleAlternativeDescription", {
          ns: "home",
        })}
        callToAction={<Trans t={t} ns="home" i18nKey="createAPoll" />}
      />
      <Bonus locale={locale} />
      <BigTestimonial />
      <MentionedBy />
      <Faq
        title={t("doodleAlternativeFaqTitle", {
          ns: "home",
          defaultValue: "Frequently asked questions",
        })}
        items={faqItems}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD from our own locale strings
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </Marketing>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  cacheLife("max");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, "home");
  return {
    title: t("doodleAlternativeMetaTitle", {
      ns: "home",
    }),
    description: t("doodleAlternativeMetaDescription", {
      ns: "home",
    }),
  };
}
