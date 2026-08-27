"use client";

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import Link from "next/link";

dayjs.extend(localizedFormat);

type Props = {
  title: string;
  category?: string;
  date: string;
  excerpt?: string;
  slug: string;
};

export const PostPreview = ({
  title,
  category,
  date,
  excerpt,
  slug,
}: Props) => {
  return (
    <article className="py-8">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        {category ? (
          <>
            <span>{category}</span>
            <span aria-hidden="true">·</span>
          </>
        ) : null}
        <time dateTime={date}>{dayjs(date).format("LL")}</time>
      </div>
      <h2 className="mt-2 text-balance font-medium text-gray-800 text-xl tracking-tight">
        <Link href={`/blog/${slug}`} className="hover:underline">
          {title}
        </Link>
      </h2>
      <p className="mt-2 max-w-prose text-pretty text-base/6 text-gray-500">
        {excerpt}
      </p>
    </article>
  );
};
