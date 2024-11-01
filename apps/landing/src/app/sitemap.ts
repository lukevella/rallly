import { supportedLngs } from "@rallly/languages";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { MetadataRoute } from "next";

import { getAllPosts } from "@/lib/api";

const alternateLanguages = supportedLngs.filter((lng) => lng !== "en");

const getAlternateLanguages = (path: string) => {
  return alternateLanguages.reduce<Record<string, string>>((acc, locale) => {
    acc[locale] = absoluteUrl(`/${locale}${path}`);
    return acc;
  }, {});
};

export default async function Sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = getAllPosts(["slug"]);

  return [
    {
      url: absoluteUrl(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: getAlternateLanguages("/"),
      },
    },
    {
      url: absoluteUrl("/pricing"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: getAlternateLanguages("/pricing"),
      },
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: getAlternateLanguages("/blog"),
      },
    },
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(), // TODO: Update posts to include a lastModified date
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
