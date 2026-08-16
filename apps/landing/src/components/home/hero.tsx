import { Badge } from "@rallly/ui/badge";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { HeroDemo } from "@/components/home/hero-demo/hero-demo";
import { getTranslation } from "@/i18n/server";

export async function Hero({
  locale,
  title,
  description,
}: {
  locale: string;
  title: React.ReactNode;
  description: React.ReactNode;
}) {
  const { t } = await getTranslation(locale, ["home"]);
  return (
    <section className="pt-6 pb-8 sm:pt-28 sm:pb-16">
      <div className="mb-6">
        <Link
          href="/blog/mobile-voting-redesign"
          prefetch={false}
          className="inline-flex items-center gap-x-2 rounded-full bg-card/50 p-1 pr-3 text-sm hover:bg-card"
        >
          <Badge variant="secondary" className="rounded-full">
            <Trans
              t={t}
              ns="home"
              i18nKey="mobileVotingBlogBadge"
              defaults="New"
            />
          </Badge>
          <span className="flex items-center gap-x-1">
            <Trans
              t={t}
              ns="home"
              i18nKey="mobileVotingBlog"
              defaults="A clearer way to vote on your phone"
            />
            <ChevronRightIcon
              className="-mr-1 size-4 transition-transform group-active:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </Link>
      </div>
      <h1 className="mb-2 text-balance font-medium text-5xl leading-tight tracking-tight">
        {title}
      </h1>
      <p className="text-balance font-normal text-gray-500 text-lg">
        {description}
      </p>
      <div className="mt-16">
        <HeroDemo locale={locale} />
      </div>
    </section>
  );
}
