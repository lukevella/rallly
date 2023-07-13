import { Trans } from "@/components/trans";
import { Post } from "@/types";

import PostPreview from "./post-preview";

type Props = {
  posts: Post[];
};

const Posts = ({ posts }: Props) => {
  return (
    <section>
      <h1 className="mb-16 text-4xl font-bold tracking-tight">
        <Trans i18nKey="blog:recentPosts" defaults="Recent Posts" />
      </h1>
      <div className="mb-16 grid grid-cols-1 gap-8">
        {posts.map((post) => (
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
};

export default Posts;
