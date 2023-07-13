import { GetStaticProps } from "next";
import { useTranslation } from "next-i18next";
import { NextSeo } from "next-seo";

import Posts from "@/components/blog/posts";
import { getBlogLayout } from "@/components/layouts/blog-layout";
import { getAllPosts } from "@/lib/api";
import { NextPageWithLayout, Post } from "@/types";
import { getStaticTranslations } from "@/utils/page-translations";

type Props = {
  allPosts: Post[];
};

const Page: NextPageWithLayout<Props> = ({ allPosts }) => {
  const { t } = useTranslation();
  return (
    <div>
      <NextSeo
        title={t("blog:blogTitle", {
          defaultValue: "Rallly - Blog",
        })}
        description={t("blog:blogDescription", {
          defaultValue: "News, updates and announcement about Rallly.",
        })}
      />
      <div>
        <Posts posts={allPosts} />
      </div>
    </div>
  );
};

Page.getLayout = getBlogLayout;

export default Page;

export const getStaticProps: GetStaticProps = async (ctx) => {
  const allPosts = getAllPosts([
    "title",
    "date",
    "slug",
    "author",
    "coverImage",
    "excerpt",
  ]);

  const res = await getStaticTranslations(["blog"])(ctx);

  if ("props" in res) {
    return {
      props: { allPosts, ...res.props },
    };
  } else {
    return res;
  }
};
