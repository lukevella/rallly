"use client";

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import Link from "next/link";

dayjs.extend(localizedFormat);

type Props = {
  title: string;
  coverImage?: string;
  date: string;
  excerpt?: string;
  slug: string;
};

export const PostPreview = ({ title, date, excerpt, slug }: Props) => {
  return (
    <article className="flex flex-col gap-2 sm:flex-row sm:gap-8">
      <div>
        <div className="text-muted-foreground w-48 pt-1 sm:text-right">
          <time dateTime={date}>{dayjs(date).format("LL")}</time>
        </div>
      </div>
      <div className="grow">
        <h3 className="mb-3 text-lg font-bold tracking-tight">
          <Link
            locale="en"
            as={`/blog/${slug}`}
            href="/blog/[slug]"
            className="hover:text-indigo-600 hover:underline"
          >
            {title}
          </Link>
        </h3>
        <p className="mb-4 text-lg leading-relaxed text-gray-600">{excerpt}</p>
      </div>
    </article>
  );
};
