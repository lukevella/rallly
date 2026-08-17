import { Badge } from "@rallly/ui/badge";
import { ArrowRightIcon } from "lucide-react";
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
    <section className="pt-6 pb-8 sm:pt-24 sm:pb-16">
      <div className="mb-8">
        <Link
          href="/blog/mobile-voting-redesign"
          prefetch={false}
          className="group inline-flex items-center gap-x-2 rounded-full bg-gray-200/50 p-1 pr-3 text-sm transition-all hover:bg-gray-200"
        >
          <Badge variant="primary" className="rounded-full">
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
          </span>
          <ArrowRightIcon
            className="size-3 text-gray-500 transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
      <h1 className="text-balance font-medium text-5xl text-gray-800 tracking-tight">
        {title}
      </h1>
      <p className="mt-6 text-balance font-normal text-gray-500 text-lg leading-relaxed">
        {description}
      </p>
      <div className="mt-16">
        <HeroDemo locale={locale} />
      </div>
    </section>
  );
}
