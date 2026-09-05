import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { MetadataRoute } from "next";
import { getAlternateLanguages } from "@/lib/alternates";
import { getAllPosts } from "@/lib/api";

const seoPages = [
  "/best-doodle-alternative",
  "/scheduling-for/assistants",
  "/scheduling-for/committees",
  "/scheduling-for/sports-clubs",
  "/scheduling-for/thesis-defense",
  "/scheduling-for/legal",
  "/free-scheduling-poll",
  "/when2meet-alternative",
];

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
    ...seoPages.map((path) => ({
      url: absoluteUrl(path),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: {
        languages: getAlternateLanguages(path),
      },
    })),
    {
      url: absoluteUrl("/press-kit"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: getAlternateLanguages("/press-kit"),
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
