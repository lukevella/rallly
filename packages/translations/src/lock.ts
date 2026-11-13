import { createHash } from "node:crypto";
import type { Messages } from "./locales.ts";
import { untranslatedPlaceholder, validateTranslation } from "./validate.ts";

export type Lock = Record<string, string>;

export type LocalePlan = {
  stale: string[];
  adopt: string[];
  orphans: string[];
};

export const hashSource = (source: string) =>
  createHash("sha256").update(source).digest("hex").slice(0, 16);

export const isCurrent = ({
  key,
  en,
  lock,
}: {
  key: string;
  en: Messages;
  lock: Lock;
}) => lock[key] === hashSource(en[key] ?? "");

const has = (record: Record<string, string>, key: string) =>
  typeof record[key] === "string";

export const planLocale = ({
  en,
  messages,
  lock,
}: {
  en: Messages;
  messages: Messages;
  lock: Lock;
}): LocalePlan => {
  const stale: string[] = [];
  const adopt: string[] = [];

  for (const [key, source] of Object.entries(en)) {
    if (source === "" || source === untranslatedPlaceholder) continue;

    if (!has(messages, key)) {
      stale.push(key);
      continue;
    }

    const locked = has(lock, key);
    if (locked && !isCurrent({ key, en, lock })) {
      stale.push(key);
      continue;
    }

    const valid =
      validateTranslation({ source, translation: messages[key] as string })
        .length === 0;
    if (!valid) stale.push(key);
    else if (!locked) adopt.push(key);
  }

  const orphans = [
    ...new Set([...Object.keys(messages), ...Object.keys(lock)]),
  ].filter((key) => !has(en, key));

  return { stale, adopt, orphans };
};
