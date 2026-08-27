"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Hero } from "@/components/home/hero";
import { Section, SectionContent } from "@/components/section";
import { getTranslation } from "@/i18n/server";
import { getAlternates } from "@/lib/alternates";
import { getAllPosts } from "@/lib/api";
import { PostPreview } from "./post-preview";

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  cacheLife("max");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, ["blog", "common"]);
  const allPosts = getAllPosts([
    "title",
    "date",
    "slug",
    "author",
    "category",
    "excerpt",
  ]);
  return (
    <Section>
      <Hero
        title={t("blog", { ns: "common", defaultValue: "Blog" })}
        description={t("blogDescription", {
          ns: "blog",
          defaultValue: "News, updates and announcements about Rallly.",
        })}
      />
      <SectionContent>
        <div className="-my-8 divide-y">
          {allPosts.map((post) => (
            <PostPreview
              key={post.slug}
              title={post.title}
              category={post.category}
              date={post.date}
              slug={post.slug}
              excerpt={post.excerpt}
            />
          ))}
        </div>
      </SectionContent>
    </Section>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  cacheLife("max");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, "blog");
  return {
    alternates: getAlternates({ locale, path: "/blog" }),
    title: t("blogTitle", {
      ns: "blog",
      defaultValue: "Rallly - Blog",
    }),
    description: t("blogDescription", {
      ns: "blog",
      defaultValue: "News, updates and announcements about Rallly.",
    }),
  };
}
