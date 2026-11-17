import fs from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const defaultLocale = "en";
const localePattern = /^[A-Za-z]{2,3}(-[A-Za-z0-9]+)*$/;

export function createPostsApi(postsDirectory: string) {
  function getPostSlugs() {
    return fs
      .readdirSync(postsDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name.replace(/\.md$/, ""));
  }

  function hasEnglish(slug: string) {
    return fs.existsSync(join(postsDirectory, `${slug}.md`));
  }

  function getPostLocales(slug: string) {
    if (!hasEnglish(slug)) return [];
    return fs
      .readdirSync(postsDirectory, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          entry.name !== defaultLocale &&
          localePattern.test(entry.name) &&
          fs.existsSync(join(postsDirectory, entry.name, `${slug}.md`)),
      )
      .map((entry) => entry.name)
      .sort();
  }

  function resolvePath({ slug, locale }: { slug: string; locale?: string }) {
    if (locale && locale !== defaultLocale && localePattern.test(locale)) {
      const translated = join(postsDirectory, locale, `${slug}.md`);
      if (fs.existsSync(translated)) {
        return { fullPath: translated, contentLocale: locale };
      }
    }
    return {
      fullPath: join(postsDirectory, `${slug}.md`),
      contentLocale: defaultLocale,
    };
  }

  function getPostBySlug(slug: string, fields: string[] = [], locale?: string) {
    const realSlug = slug.replace(/\.md$/, "");
    if (!hasEnglish(realSlug)) return null;
    const { fullPath, contentLocale } = resolvePath({
      slug: realSlug,
      locale,
    });
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    type Items = {
      [key: string]: string;
    };

    const items: Items = {};

    // Ensure only the minimal needed data is exposed
    fields.forEach((field) => {
      if (field === "slug") {
        items[field] = realSlug;
      }
      if (field === "content") {
        items[field] = content;
      }
      if (field === "contentLocale") {
        items[field] = contentLocale;
      }

      if (typeof data[field] !== "undefined") {
        items[field] = data[field];
      }
    });

    return items;
  }

  function getAllPosts(fields: string[] = [], locale?: string) {
    return (
      getPostSlugs()
        .map((slug) => getPostBySlug(slug, fields, locale))
        .filter((post): post is NonNullable<typeof post> => post !== null)
        // sort posts by date in descending order
        .sort((post1, post2) => (post1.date > post2.date ? -1 : 1))
    );
  }

  return { getPostSlugs, getPostBySlug, getAllPosts, getPostLocales };
}

export const { getPostSlugs, getPostBySlug, getAllPosts, getPostLocales } =
  createPostsApi(join(process.cwd(), "src", "posts"));
