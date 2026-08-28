"use cache";

import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Trans } from "react-i18next/TransWithoutContext";
import DateFormatter from "@/components/blog/date-formatter";
import { Cta } from "@/components/home/cta";
import { Section } from "@/components/section";
import { getTranslation } from "@/i18n/server";
import { getAllPosts, getPostBySlug } from "@/lib/api";

export default async function Page(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  cacheLife("max");
  const params = await props.params;
  const { t, i18n } = await getTranslation(params.locale, [
    "blog",
    "common",
    "home",
  ]);
  const post = getPostBySlug(params.slug, [
    "title",
    "date",
    "slug",
    "author",
    "category",
    "excerpt",
    "content",
  ]);

  if (!post) {
    notFound();
  }

  return (
    <div className="divide-y">
      <Section>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/blog" className="text-gray-500 hover:text-gray-800">
            <Trans
              t={t}
              i18n={i18n}
              ns="common"
              i18nKey="blog"
              defaults="Blog"
            />
          </Link>
          {post.category ? (
            <>
              <span aria-hidden="true" className="text-gray-400">
                /
              </span>
              <span className="text-gray-800">{post.category}</span>
            </>
          ) : null}
        </nav>
        <h1 className="mt-8 max-w-2xl text-balance font-medium text-3xl text-gray-800 tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <aside className="lg:sticky lg:top-24 lg:order-2 lg:w-56 lg:shrink-0">
            <dl className="flex flex-wrap gap-x-12 gap-y-6 lg:flex-col">
              <div>
                <dt className="text-gray-500 text-sm">
                  <Trans
                    t={t}
                    i18n={i18n}
                    ns="blog"
                    i18nKey="blogPublishedOn"
                    defaults="Published on"
                  />
                </dt>
                <dd className="mt-1 text-gray-800">
                  <DateFormatter dateString={post.date} />
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-sm">
                  <Trans
                    t={t}
                    i18n={i18n}
                    ns="blog"
                    i18nKey="blogWrittenBy"
                    defaults="Written by"
                  />
                </dt>
                <dd className="mt-1 flex items-center gap-2">
                  <Image
                    src="https://d39ixtfgglw55o.cloudfront.net/images/luke.webp"
                    width={24}
                    height={24}
                    className="rounded-full"
                    alt=""
                  />
                  <Link
                    className="text-gray-800 hover:underline"
                    href="https://twitter.com/imlukevella"
                  >
                    Luke Vella
                  </Link>
                </dd>
              </div>
            </dl>
          </aside>
          <article className="longform min-w-0 max-w-2xl lg:order-1">
            <MDXRemote source={post.content} />
          </article>
        </div>
      </Section>
      <Section className="sm:py-24">
        <Cta
          title={
            <Trans
              t={t}
              i18n={i18n}
              ns="home"
              i18nKey="finalCtaTitle"
              defaults="Ready to find the best time to meet?"
            />
          }
          description={
            <Trans
              t={t}
              i18n={i18n}
              ns="home"
              i18nKey="finalCtaDescription"
              defaults="Set up your poll in under a minute. No account, no downloads, no chasing people for replies."
            />
          }
          buttonLabel={
            <Trans
              t={t}
              i18n={i18n}
              ns="home"
              i18nKey="createAPoll"
              defaults="Create a poll"
            />
          }
          hint={
            <Trans
              t={t}
              i18n={i18n}
              ns="home"
              i18nKey="hint"
              defaults="It's free! No login required."
            />
          }
        />
      </Section>
    </div>
  );
}

export async function generateStaticParams() {
  const posts = getAllPosts(["slug"]);
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  cacheLife("max");
  const params = await props.params;
  const post = getPostBySlug(params.slug, [
    "title",
    "date",
    "slug",
    "author",
    "excerpt",
  ]);

  if (!post) {
    notFound();
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: absoluteUrl(`/blog/${post.slug}`),
      images: [
        {
          url: absoluteUrl("/api/og-image", {
            title: post.title,
            excerpt: post.excerpt,
          }),
          width: 1200,
          height: 630,
          alt: post.title,
          type: "image/png",
        },
      ],
    },
  };
}
