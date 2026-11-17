import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import type { Messages } from "./locales.ts";
import { listLocales, localeRoots, postLockPath, postsDir } from "./locales.ts";
import { hashSource } from "./lock.ts";
import { translatePost } from "./post-translator.ts";
import { validatePost } from "./post-validate.ts";
import type { Glossary } from "./prompt.ts";
import type { RunReport } from "./run.ts";
import type { Complete } from "./translator.ts";

const postsInFlight = 8;

const landing = localeRoots.find(
  (root) => root.id === "landing",
) as (typeof localeRoots)[number];

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const slugsIn = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
        .map((entry) => basename(entry.name, ".md"))
        .sort()
    : [];

export const listPosts = ({ repoRoot }: { repoRoot: string }) =>
  slugsIn(join(repoRoot, postsDir));

export const postPath = ({
  repoRoot,
  locale,
  slug,
}: {
  repoRoot: string;
  locale?: string;
  slug: string;
}) =>
  locale === undefined
    ? join(repoRoot, postsDir, `${slug}.md`)
    : join(repoRoot, postsDir, locale, `${slug}.md`);

const readLock = ({
  repoRoot,
  locale,
}: {
  repoRoot: string;
  locale: string;
}) => {
  const file = postLockPath({ repoRoot, locale });
  if (!existsSync(file)) return {} as Messages;
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${file}: ${errorText(error)}`);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${file}: expected a JSON object`);
  }
  return value as Messages;
};

export const planPosts = ({
  repoRoot,
  locale,
}: {
  repoRoot: string;
  locale: string;
}) => {
  const posts = listPosts({ repoRoot });
  const translated = slugsIn(join(repoRoot, postsDir, locale));
  const lock = readLock({ repoRoot, locale });
  const stale: string[] = [];
  const adopt: string[] = [];

  for (const slug of posts) {
    if (!translated.includes(slug)) {
      stale.push(slug);
      continue;
    }
    const source = readFileSync(postPath({ repoRoot, slug }), "utf8");
    const translation = readFileSync(
      postPath({ repoRoot, locale, slug }),
      "utf8",
    );
    const locked = typeof lock[slug] === "string";
    if (locked && lock[slug] !== hashSource(source)) stale.push(slug);
    else if (validatePost({ source, translation }).length > 0) stale.push(slug);
    else if (!locked) adopt.push(slug);
  }

  const orphans = [...new Set([...translated, ...Object.keys(lock)])].filter(
    (slug) => !posts.includes(slug),
  );

  return { stale, adopt, orphans };
};

const isPlainSlug = (slug: string) =>
  /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(slug) && !slug.includes("..");

const guardLocale = (locale: string) => {
  if (locale === "" || locale === "en") {
    throw new Error(`Refusing to write posts for locale "${locale}"`);
  }
};

type LocalePlan = ReturnType<typeof planPosts> & {
  locale: string;
  sources: Map<string, string>;
  lock: Messages;
  translated: Map<string, string>;
  failed: { key: string; reason: string }[];
};

export const runPosts = async ({
  repoRoot,
  complete,
  model,
  glossary,
  locales,
  dryRun = false,
}: {
  repoRoot: string;
  complete: Complete;
  model: string;
  glossary: Glossary;
  locales?: string[];
  dryRun?: boolean;
}): Promise<RunReport["files"]> => {
  if (
    !existsSync(join(repoRoot, landing.dir)) ||
    !existsSync(join(repoRoot, postsDir))
  ) {
    return [];
  }
  const posts = listPosts({ repoRoot });
  const targets = listLocales({ repoRoot, root: landing }).filter(
    (locale) => !locales || locales.includes(locale),
  );

  const entries: (RunReport["files"][number] | LocalePlan)[] = targets.map(
    (locale) => {
      try {
        guardLocale(locale);
        const plan = planPosts({ repoRoot, locale });
        const sources = new Map(
          posts.map((slug) => [
            slug,
            readFileSync(postPath({ repoRoot, slug }), "utf8"),
          ]),
        );
        return {
          ...plan,
          locale,
          sources,
          lock: readLock({ repoRoot, locale }),
          translated: new Map(),
          failed: [],
        };
      } catch (error) {
        return {
          path: `posts/${locale}`,
          translated: 0,
          adopted: 0,
          removed: 0,
          failed: [{ key: "*", reason: errorText(error) }],
        };
      }
    },
  );

  const plans = entries.filter(
    (entry): entry is LocalePlan => "locale" in entry,
  );
  const jobs = plans.flatMap((plan) =>
    plan.stale.map((slug) => ({ plan, slug })),
  );
  let next = 0;

  const worker = async () => {
    while (next < jobs.length) {
      const { plan, slug } = jobs[next++] as (typeof jobs)[number];
      const { locale } = plan;
      try {
        const file = postPath({ repoRoot, locale, slug });
        const result = await translatePost({
          complete,
          model,
          locale,
          glossary,
          source: plan.sources.get(slug) as string,
          ...(existsSync(file) && { previous: readFileSync(file, "utf8") }),
        });
        if (!result.ok) {
          plan.failed.push({ key: slug, reason: result.reason });
          continue;
        }
        if (!dryRun) {
          mkdirSync(dirname(file), { recursive: true });
          writeFileSync(file, result.content);
        }
        plan.translated.set(slug, result.content);
      } catch (error) {
        plan.failed.push({ key: slug, reason: errorText(error) });
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(postsInFlight, jobs.length) }, worker),
  );

  return entries.map((entry) => {
    if (!("locale" in entry)) return entry;
    const { locale, adopt, orphans, translated, failed, lock, sources } = entry;
    const report = {
      path: `posts/${locale}`,
      translated: translated.size,
      adopted: adopt.length,
      removed: orphans.filter(isPlainSlug).length,
      failed: failed.sort((a, b) => a.key.localeCompare(b.key)),
    };
    const dropped = orphans.length - report.removed;
    if (
      report.translated + report.adopted + report.removed + dropped === 0 ||
      dryRun
    ) {
      return report;
    }
    try {
      for (const slug of orphans.filter(isPlainSlug)) {
        rmSync(postPath({ repoRoot, locale, slug }), { force: true });
      }
      const newLock: Messages = {};
      for (const slug of posts) {
        if (translated.has(slug) || adopt.includes(slug)) {
          newLock[slug] = hashSource(sources.get(slug) as string);
        } else if (typeof lock[slug] === "string") {
          newLock[slug] = lock[slug];
        }
      }
      const file = postLockPath({ repoRoot, locale });
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `${JSON.stringify(newLock, null, 2)}\n`);
    } catch (error) {
      return {
        path: report.path,
        translated: 0,
        adopted: 0,
        removed: 0,
        failed: [{ key: "*", reason: errorText(error) }],
      };
    }
    return report;
  });
};
