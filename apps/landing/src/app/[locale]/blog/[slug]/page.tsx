import { absoluteUrl } from "@rallly/utils/absolute-url";
import { ArrowLeftIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";

import PostHeader from "@/components/blog/post-header";
import { getAllPosts, getPostBySlug } from "@/lib/api";

export default async function Page({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug, [
    "title",
    "date",
    "slug",
    "author",
    "excerpt",
    "content",
  ]);

  return (
    <div>
      <nav className="mb-2">
        <Link
          className="text-muted-foreground hover:text-primary inline-flex items-center gap-x-2 text-sm font-medium"
          href="/blog"
        >
          <ArrowLeftIcon className="size-4" /> All Posts
        </Link>
      </nav>
      <article className="space-y-8">
        <PostHeader title={post.title} date={post.date} />
        <div className="blog-content">
          <MDXRemote source={post.content} />
        </div>
        <div className="mt-8 flex items-center gap-x-4">
          <Image
            src="/static/images/luke-vella.jpg"
            width={48}
            height={48}
            className="rounded-full"
            alt="Luke Vella"
          />
          <div>
            <div className="font-medium leading-none">Luke Vella</div>
            <div>
              <Link
                className="text-muted-foreground hover:text-primary text-sm"
                href="https://twitter.com/imlukevella"
              >
                @imlukevella
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = getAllPosts(["slug"]);
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const post = getPostBySlug(params.slug, [
    "title",
    "date",
    "slug",
    "author",
    "excerpt",
  ]);

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
