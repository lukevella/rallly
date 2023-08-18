import { ArrowLeftIcon } from "@rallly/icons";
import { absoluteUrl } from "@rallly/utils";
import { GetStaticPropsContext } from "next";
import ErrorPage from "next/error";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { NextSeo } from "next-seo";

import PostBody from "@/components/blog/post-body";
import PostHeader from "@/components/blog/post-header";
import { getBlogLayout } from "@/components/layouts/blog-layout";
import { getAllPosts, getPostBySlug } from "@/lib/api";
import markdownToHtml from "@/lib/markdownToHtml";
import { NextPageWithLayout, Post } from "@/types";
import { getStaticTranslations } from "@/utils/page-translations";

type Props = {
  post: Post;
  morePosts: Post[];
};

const Page: NextPageWithLayout<Props> = ({ post }) => {
  const router = useRouter();

  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <div>
      <NextSeo
        title={post.title}
        description={post.excerpt}
        openGraph={{
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
        }}
      />
      <nav className="mb-2">
        <Link
          className="text-muted-foreground hover:text-primary inline-flex items-center gap-x-2 text-sm font-medium"
          href="/blog"
        >
          <ArrowLeftIcon className="h-4 w-4" /> All Posts
        </Link>
      </nav>
      <article>
        <Head>
          <title>{post.title}</title>
        </Head>
        <PostHeader title={post.title} date={post.date} />
        <PostBody content={post.content} />
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
};

Page.getLayout = getBlogLayout;

export default Page;

export async function getStaticProps(ctx: GetStaticPropsContext) {
  const res = await getStaticTranslations(["blog"])(ctx);
  const post = getPostBySlug(ctx.params?.slug as string, [
    "title",
    "date",
    "slug",
    "author",
    "excerpt",
    "content",
  ]);
  const content = await markdownToHtml(post.content || "");

  if ("props" in res) {
    return {
      props: {
        post: {
          ...post,
          content,
        },
        ...res.props,
      },
    };
  }
}

export async function getStaticPaths() {
  const posts = getAllPosts(["slug"]);

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug,
        },
      };
    }),
    fallback: false,
  };
}
