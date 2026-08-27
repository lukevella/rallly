"use client";

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import Image from "next/image";
import Link from "next/link";

dayjs.extend(localizedFormat);

type Props = {
  title: string;
  coverImage?: string;
  date: string;
  excerpt?: string;
  slug: string;
};

export const PostPreview = ({
  title,
  coverImage,
  date,
  excerpt,
  slug,
}: Props) => {
  return (
    <article className="h-full">
      <Link
        href={`/blog/${slug}`}
        className="flex h-full flex-col rounded-2xl border bg-white p-1 transition-colors hover:border-gray-300"
      >
        {coverImage ? (
          <div className="overflow-hidden rounded-xl border">
            <Image
              src={coverImage}
              alt=""
              width={640}
              height={400}
              unoptimized
              className="w-full"
            />
          </div>
        ) : null}
        <div className="p-3">
          <time dateTime={date} className="text-gray-500 text-sm">
            {dayjs(date).format("LL")}
          </time>
          <h2 className="mt-2 font-medium text-gray-900 tracking-tight">
            {title}
          </h2>
          <p className="mt-2 text-pretty text-base/6 text-gray-500 sm:text-sm/5">
            {excerpt}
          </p>
        </div>
      </Link>
    </article>
  );
};
