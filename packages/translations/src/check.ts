import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  listLocales,
  listNamespaces,
  localeRoots,
  lockPath,
  postLockPath,
} from "./locales.ts";
import { hashSource, isCurrent } from "./lock.ts";
import { validatePost } from "./post-validate.ts";
import { listPosts, postPath } from "./posts.ts";
import { untranslatedPlaceholder, validateTranslation } from "./validate.ts";

export type Offender = { path: string; key: string; reasons: string[] };

const readObject = (path: string) => {
  if (!existsSync(path)) return {};
  const value: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("expected a JSON object");
  }
  return value as Record<string, unknown>;
};

const strings = (record: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(record).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );

export const checkLocales = ({ repoRoot }: { repoRoot: string }) => {
  const offenders: Offender[] = [];
  const rel = (path: string) => relative(repoRoot, path);

  for (const root of localeRoots) {
    for (const namespace of listNamespaces({ repoRoot, root })) {
      const enPath = join(repoRoot, root.dir, "en", `${namespace}.json`);
      let en: Record<string, string>;
      try {
        en = strings(readObject(enPath));
      } catch (error) {
        offenders.push({
          path: rel(enPath),
          key: "*",
          reasons: [(error as Error).message],
        });
        continue;
      }

      for (const locale of listLocales({ repoRoot, root })) {
        const messagesPath = join(
          repoRoot,
          root.dir,
          locale,
          `${namespace}.json`,
        );
        const lockFile = lockPath({
          repoRoot,
          rootId: root.id,
          locale,
          namespace,
        });

        let messages: Record<string, unknown>;
        let lock: Record<string, string>;
        try {
          messages = readObject(messagesPath);
        } catch (error) {
          offenders.push({
            path: rel(messagesPath),
            key: "*",
            reasons: [(error as Error).message],
          });
          continue;
        }
        try {
          lock = strings(readObject(lockFile));
        } catch (error) {
          offenders.push({
            path: rel(lockFile),
            key: "*",
            reasons: [(error as Error).message],
          });
          continue;
        }

        for (const [key, source] of Object.entries(en)) {
          if (!source || source === untranslatedPlaceholder) continue;
          const translation = messages[key];
          if (typeof translation !== "string") continue;
          if (!isCurrent({ key, en, lock })) continue;
          const reasons = validateTranslation({ source, translation });
          if (reasons.length > 0) {
            offenders.push({ path: rel(messagesPath), key, reasons });
          }
        }
      }
    }
  }

  const landing = localeRoots.find((root) => root.id === "landing");
  const posts = listPosts({ repoRoot });
  if (landing && posts.length > 0) {
    for (const locale of listLocales({ repoRoot, root: landing })) {
      const lockFile = postLockPath({ repoRoot, locale });
      let lock: Record<string, string> = {};
      try {
        lock = strings(readObject(lockFile));
      } catch (error) {
        offenders.push({
          path: rel(lockFile),
          key: "*",
          reasons: [(error as Error).message],
        });
        continue;
      }
      for (const slug of posts) {
        const translationPath = postPath({ repoRoot, locale, slug });
        if (!existsSync(translationPath)) continue;
        const source = readFileSync(postPath({ repoRoot, slug }), "utf8");
        if (lock[slug] !== hashSource(source)) continue;
        const reasons = validatePost({
          source,
          translation: readFileSync(translationPath, "utf8"),
        });
        if (reasons.length > 0) {
          offenders.push({ path: rel(translationPath), key: "*", reasons });
        }
      }
    }
  }

  return offenders;
};

const isEntryPoint =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntryPoint) {
  const repoRoot = resolve(import.meta.dirname, "../../..");
  const offenders = checkLocales({ repoRoot });
  for (const { path, key, reasons } of offenders) {
    console.error(`${path} → ${key}: ${reasons.join("; ")}`);
  }
  if (offenders.length > 0) {
    console.error(
      `\nFound ${offenders.length} invalid locale string(s) or post(s). Fix the translation, or change the English source so the Translate workflow retranslates it.`,
    );
    process.exit(1);
  }
  console.log("Locale files OK");
}
