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
  model: string;
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
  glossary,
  dryRun,
}: {
  repoRoot: string;
  job: Job;
  complete: Complete;
  model: string;
  glossary: Glossary;
  dryRun: boolean;
}): Promise<RunReport["files"][number]> => {
  const { rootId, dir, locale, namespace } = job;
  const enPath = join(repoRoot, dir, "en", `${namespace}.json`);
  const messagesPath = join(repoRoot, dir, locale, `${namespace}.json`);
  const lockFile = lockPath({ repoRoot, rootId, locale, namespace });

  const path = `${rootId}/${locale}/${namespace}`;
  const readOne = (file: string) => {
    let value: unknown;
    try {
      value = readMessages(file);
    } catch (error) {
      throw new Error(
        `${file}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      const found =
        value === null
          ? "null"
          : Array.isArray(value)
            ? "an array"
            : typeof value;
      throw new Error(`${file}: expected a JSON object, found ${found}`);
    }
    return value as Messages;
  };

  const failedFile = (error: unknown) => ({
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
  });

  const write = ({
    file,
    values,
    order,
  }: {
    file: string;
    values: Messages;
    order: string[];
  }) => {
    try {
      writeMessages({ path: file, messages: values, order });
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
    return failedFile(error);
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

  try {
    if (report.translated > 0 || plan.orphans.some((key) => key in messages)) {
      write({
        file: messagesPath,
        values: { ...without(messages, plan.orphans), ...translated },
        order,
      });
    }
    write({ file: lockFile, values: newLock, order });
  } catch (error) {
    return failedFile(error);
  }

  return report;
};

export const run = async ({
  repoRoot,
  complete,
  model,
  locales,
  files,
  dryRun = false,
}: {
  repoRoot: string;
  complete: Complete;
  model: string;
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
        glossary,
        dryRun,
      });
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(maxInFlight, jobs.length) }, worker),
  );

  return { model, files: results };
};

export const shouldFail = (report: RunReport) => {
  const attempted = report.files.filter(
    (file) => file.translated > 0 || file.failed.length > 0,
  );
  return (
    attempted.length > 0 && attempted.every((file) => file.translated === 0)
  );
};

const maxReportLength = 60_000;
const omissionReserve = 200;

const code = (text: string) => {
  const flat = text.replace(/\s*\n\s*/g, " ");
  const longestRun = Math.max(
    0,
    ...(flat.match(/`+/g) ?? []).map((run) => run.length),
  );
  const fence = "`".repeat(longestRun + 1);
  const pad = flat.startsWith("`") || flat.endsWith("`") ? " " : "";
  return `${fence}${pad}${flat}${pad}${fence}`;
};

export const formatReport = (report: RunReport) => {
  const changed = report.files.filter(
    (file) =>
      file.translated + file.adopted + file.removed > 0 ||
      file.failed.length > 0,
  );
  if (changed.length === 0) return "No translation changes.\n";

  const sum = (pick: (file: RunReport["files"][number]) => number) =>
    changed.reduce((total, file) => total + pick(file), 0);

  const lines = [
    `Model: ${report.model}`,
    "",
    "| Locale file | Translated | Adopted | Removed |",
    "| --- | ---: | ---: | ---: |",
    ...changed.map(
      (file) =>
        `| ${file.path} | ${file.translated} | ${file.adopted} | ${file.removed} |`,
    ),
    `| **Total** | **${sum((f) => f.translated)}** | **${sum((f) => f.adopted)}** | **${sum((f) => f.removed)}** |`,
  ];

  const withFailures = changed.filter((file) => file.failed.length > 0);
  if (withFailures.length > 0) {
    lines.push("", "### Failed validation", "");
    let length = lines.join("\n").length;
    let omitted = 0;
    for (const file of withFailures) {
      const heading = [`**${file.path}**`, ""];
      let headed = false;
      for (const { key, reason } of file.failed) {
        const line =
          key === "*"
            ? `- Whole file failed: ${code(reason)}`
            : `- ${code(key)}: ${code(reason)}`;
        const added =
          line.length + 1 + (headed ? 0 : heading.join("\n").length + 1);
        if (omitted > 0 || length + added > maxReportLength - omissionReserve) {
          omitted++;
          continue;
        }
        if (!headed) {
          lines.push(...heading);
          headed = true;
        }
        lines.push(line);
        length += added;
      }
      if (headed) {
        lines.push("");
        length += 1;
      }
    }
    if (omitted > 0) {
      lines.push(
        `_${omitted} more ${omitted === 1 ? "failure" : "failures"} omitted to stay under GitHub's character limit._`,
      );
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
};
