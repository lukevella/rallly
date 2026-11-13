import { existsSync } from "node:fs";
import { join } from "node:path";
import type { LocaleRoot, Messages } from "./locales.ts";
import {
  listLocales,
  listNamespaces,
  localeRoots,
  lockPath,
  readMessages,
  writeMessages,
} from "./locales.ts";
import { hashSource, planLocale } from "./lock.ts";
import type { Glossary, TranslationItem } from "./prompt.ts";
import { loadGlossary } from "./prompt.ts";
import type { Complete } from "./translator.ts";
import { translateItems } from "./translator.ts";

const maxInFlight = 4;

export type RunReport = {
  files: {
    path: string;
    translated: number;
    adopted: number;
    removed: number;
    failed: { key: string; reason: string }[];
  }[];
};

type Job = {
  rootId: LocaleRoot["id"];
  dir: string;
  locale: string;
  namespace: string;
};

const without = (record: Record<string, string>, keys: string[]) =>
  Object.fromEntries(
    Object.entries(record).filter(([key]) => !keys.includes(key)),
  );

const listJobs = ({
  repoRoot,
  locales,
  files,
}: {
  repoRoot: string;
  locales?: string[];
  files?: string[];
}) => {
  const jobs: Job[] = [];
  for (const root of localeRoots) {
    if (!existsSync(join(repoRoot, root.dir, "en"))) continue;
    const namespaces = listNamespaces({ repoRoot, root }).filter(
      (namespace) => !files || files.includes(`${root.id}/${namespace}`),
    );
    const rootLocales = listLocales({ repoRoot, root }).filter(
      (locale) => !locales || locales.includes(locale),
    );
    for (const locale of rootLocales) {
      for (const namespace of namespaces) {
        jobs.push({ rootId: root.id, dir: root.dir, locale, namespace });
      }
    }
  }
  return jobs;
};

const runFile = async ({
  repoRoot,
  job,
  complete,
  model,
  provider,
  glossary,
  dryRun,
}: {
  repoRoot: string;
  job: Job;
  complete: Complete;
  model: string;
  provider?: string;
  glossary: Glossary;
  dryRun: boolean;
}): Promise<RunReport["files"][number]> => {
  const { rootId, dir, locale, namespace } = job;
  const enPath = join(repoRoot, dir, "en", `${namespace}.json`);
  const messagesPath = join(repoRoot, dir, locale, `${namespace}.json`);
  const lockFile = lockPath({ repoRoot, rootId, locale, namespace });

  const path = `${rootId}/${locale}/${namespace}`;
  const readOne = (file: string) => {
    try {
      return readMessages(file);
    } catch (error) {
      throw new Error(
        `${file}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  let en: Messages;
  let messages: Messages;
  let lock: Messages;
  let plan: ReturnType<typeof planLocale>;
  try {
    en = readOne(enPath);
    messages = readOne(messagesPath);
    lock = readOne(lockFile);
    plan = planLocale({ en, messages, lock });
  } catch (error) {
    return {
      path,
      translated: 0,
      adopted: 0,
      removed: 0,
      failed: [
        {
          key: "*",
          reason: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }

  let translated: Messages = {};
  let failed: { key: string; reason: string }[] = [];

  if (plan.stale.length > 0) {
    const items: TranslationItem[] = plan.stale.map((key) => ({
      key,
      source: en[key] as string,
      ...(typeof messages[key] === "string" && { previous: messages[key] }),
    }));
    try {
      const result = await translateItems({
        complete,
        model,
        provider,
        locale,
        glossary,
        reference: messages,
        items,
      });
      translated = result.translated;
      failed = result.failed;
    } catch (error) {
      failed = [
        {
          key: "*",
          reason: error instanceof Error ? error.message : String(error),
        },
      ];
    }
  }

  const translatedKeys = Object.keys(translated);
  const report = {
    path,
    translated: translatedKeys.length,
    adopted: plan.adopt.length,
    removed: plan.orphans.length,
    failed,
  };

  if (report.translated + report.adopted + report.removed === 0 || dryRun) {
    return report;
  }

  const newLock = without(lock, plan.orphans);
  for (const key of [...translatedKeys, ...plan.adopt]) {
    newLock[key] = hashSource(en[key] as string);
  }
  const order = Object.keys(en);

  if (report.translated > 0 || plan.orphans.some((key) => key in messages)) {
    writeMessages({
      path: messagesPath,
      messages: { ...without(messages, plan.orphans), ...translated },
      order,
    });
  }
  writeMessages({ path: lockFile, messages: newLock, order });

  return report;
};

export const run = async ({
  repoRoot,
  complete,
  model,
  provider,
  locales,
  files,
  dryRun = false,
}: {
  repoRoot: string;
  complete: Complete;
  model: string;
  provider?: string;
  locales?: string[];
  files?: string[];
  dryRun?: boolean;
}): Promise<RunReport> => {
  const glossary = loadGlossary({ repoRoot });
  const jobs = listJobs({ repoRoot, locales, files });
  const results: RunReport["files"] = new Array(jobs.length);
  let next = 0;

  const worker = async () => {
    while (next < jobs.length) {
      const index = next++;
      results[index] = await runFile({
        repoRoot,
        job: jobs[index] as Job,
        complete,
        model,
        provider,
        glossary,
        dryRun,
      });
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(maxInFlight, jobs.length) }, worker),
  );

  return { files: results };
};

export const shouldFail = (report: RunReport) => {
  const attempted = report.files.filter(
    (file) => file.translated > 0 || file.failed.length > 0,
  );
  return (
    attempted.length > 0 && attempted.every((file) => file.translated === 0)
  );
};

export const formatReport = (report: RunReport) => {
  const changed = report.files.filter(
    (file) =>
      file.translated + file.adopted + file.removed > 0 ||
      file.failed.length > 0,
  );
  if (changed.length === 0) return "No translation changes.\n";

  const lines = [
    "| Locale file | Translated | Adopted | Removed |",
    "| --- | ---: | ---: | ---: |",
    ...changed.map(
      (file) =>
        `| ${file.path} | ${file.translated} | ${file.adopted} | ${file.removed} |`,
    ),
  ];

  const withFailures = changed.filter((file) => file.failed.length > 0);
  if (withFailures.length > 0) {
    lines.push("", "### Failed validation", "");
    for (const file of withFailures) {
      lines.push(`**${file.path}**`, "");
      for (const { key, reason } of file.failed) {
        lines.push(
          key === "*"
            ? `- Whole file failed: ${reason}`
            : `- \`${key}\`: ${reason}`,
        );
      }
      lines.push("");
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
};
