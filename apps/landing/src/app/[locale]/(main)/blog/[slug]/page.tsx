import { Button } from "@rallly/ui/button";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import PostHeader from "@/components/blog/post-header";
import { getAllPosts, getPostBySlug } from "@/lib/api";

export default async function Page(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const params = await props.params;
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
      <nav className="mb-4">
        <Button asChild variant="ghost">
          <Link href="/blog">
            <ArrowLeftIcon className="size-4" /> All Posts
          </Link>
        </Button>
      </nav>
      <article className="space-y-4">
        <PostHeader title={post.title} date={post.date} />
        <div className="blog-content">
          <MDXRemote source={post.content} />
        </div>
        <div className="mt-8 flex items-center gap-x-4">
          <Image
            src="https://d39ixtfgglw55o.cloudfront.net/images/luke.webp"
            width={48}
            height={48}
            className="rounded-full"
            alt="Luke Vella"
          />
          <div>
            <div className="font-medium text-foreground leading-none">
              Luke Vella
            </div>
            <div>
              <Link
                className="text-muted-foreground text-sm hover:underline"
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

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
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
