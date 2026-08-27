"use client";

import { cn } from "@rallly/ui";
import * as React from "react";
import { PostPreview } from "./post-preview";

type Post = {
  title: string;
  category?: string;
  date: string;
  excerpt?: string;
  slug: string;
};

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active
          ? "border-gray-300 bg-gray-200/50 font-medium text-gray-800"
          : "bg-white text-gray-600 hover:border-gray-300",
      )}
    >
      {children}
    </button>
  );
}

export function PostsList({
  posts,
  allLabel,
}: {
  posts: Post[];
  allLabel: string;
}) {
  const [category, setCategory] = React.useState<string | null>(null);

  const categories = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      if (post.category) {
        counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
      }
    }
    return Array.from(counts.keys()).sort(
      (a, b) =>
        (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b),
    );
  }, [posts]);

  const filtered = category
    ? posts.filter((post) => post.category === category)
    : posts;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <FilterPill
          active={category === null}
          onClick={() => setCategory(null)}
        >
          {allLabel}
        </FilterPill>
        {categories.map((c) => (
          <FilterPill
            key={c}
            active={category === c}
            onClick={() => setCategory(c)}
          >
            {c}
          </FilterPill>
        ))}
      </div>
      <div className="mt-8 divide-y border-t">
        {filtered.map((post) => (
          <PostPreview
            key={post.slug}
            title={post.title}
            category={post.category}
            date={post.date}
            slug={post.slug}
            excerpt={post.excerpt}
          />
        ))}
      </div>
    </div>
  );
}
