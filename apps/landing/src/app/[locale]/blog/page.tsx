import { Trans } from "react-i18next/TransWithoutContext";

import type { URLParams } from "@/app/[locale]/types";
import { getTranslation } from "@/i18n/server";
import { getAllPosts } from "@/lib/api";

import { PostPreview } from "./post-preview";

export default async function Page({ params }: { params: URLParams }) {
  const { t } = await getTranslation(params.locale, "blog");
  const allPosts = getAllPosts([
    "title",
    "date",
    "slug",
    "author",
    "coverImage",
    "excerpt",
  ]);
  return (
    <section>
      <h1 className="mb-16 text-4xl font-bold tracking-tight">
        <Trans t={t} ns="blog" i18nKey="recentPosts" defaults="Recent Posts" />
      </h1>
      <div className="mb-16 grid grid-cols-1 gap-8">
        {allPosts.map((post) => (
          <PostPreview
            key={post.slug}
            title={post.title}
            coverImage={post.coverImage}
            date={post.date}
            slug={post.slug}
            excerpt={post.excerpt}
          />
        ))}
      </div>
    </section>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale, "blog");
  return {
    title: t("blogTitle", {
      ns: "blog",
      defaultValue: "Rallly - Blog",
    }),
    description: t("blogDescription", {
      ns: "blog",
      defaultValue: "News, updates and announcement about Rallly.",
    }),
  };
}
