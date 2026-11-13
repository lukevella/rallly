import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";

export type LocaleRoot = { id: "web" | "landing" | "emails"; dir: string };

export const localeRoots: LocaleRoot[] = [
  { id: "web", dir: "apps/web/public/locales" },
  { id: "landing", dir: "apps/landing/public/locales" },
  { id: "emails", dir: "packages/emails/locales" },
];

export type Messages = Record<string, string>;

export type LocaleFile = {
  rootId: LocaleRoot["id"];
  locale: string;
  namespace: string;
  path: string;
};

export const listNamespaces = ({
  repoRoot,
  root,
}: {
  repoRoot: string;
  root: LocaleRoot;
}) =>
  readdirSync(join(repoRoot, root.dir, "en"))
    .filter((file) => file.endsWith(".json"))
    .map((file) => basename(file, ".json"));

export const listLocales = ({
  repoRoot,
  root,
}: {
  repoRoot: string;
  root: LocaleRoot;
}) =>
  readdirSync(join(repoRoot, root.dir), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "en")
    .map((entry) => entry.name)
    .sort();

export const readMessages = (path: string): Messages =>
  existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};

export const writeMessages = ({
  path,
  messages,
  order,
}: {
  path: string;
  messages: Messages;
  order: string[];
}) => {
  if (path.split(/[\\/]/).includes("en")) {
    throw new Error(`Refusing to write English locale file: ${path}`);
  }

  const ordered: Messages = {};
  for (const key of order) {
    const value = messages[key];
    if (value !== undefined) ordered[key] = value;
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(ordered, null, 2)}\n`);
};

export const lockPath = ({
  repoRoot,
  rootId,
  locale,
  namespace,
}: {
  repoRoot: string;
  rootId: LocaleRoot["id"];
  locale: string;
  namespace: string;
}) => join(repoRoot, "i18n", "lock", rootId, locale, `${namespace}.json`);
