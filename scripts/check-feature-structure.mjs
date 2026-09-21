#!/usr/bin/env node
/**
 * Enforces the file vocabulary for apps/web/src/features/.
 *
 * Every feature directory (and any sub-concern directory within it) may only
 * contain the allowed file names below, co-located tests, and the directories
 * `components/` and `assets/` (whose contents are unrestricted).
 *
 * Every export from a `loaders.ts` is named with a `load*` prefix. Loaders
 * that redirect or throw take the bare prefix; loaders that return null for
 * a missing actor are `loadOptional*`.
 *
 * A useFilenamingConvention override in apps/web/biome.json mirrors this rule
 * at warn severity for in-editor feedback (JS/TS files only) — keep the two
 * in sync when the vocabulary changes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FEATURES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/web/src/features",
);

const ALLOWED_FILES = new Set([
  "data.ts",
  "loaders.ts",
  "mutations.ts",
  "actions.ts",
  "schema.ts",
  "types.ts",
  "ability.ts",
  "constants.ts",
  "utils.ts",
  "client.tsx",
  "service.ts",
]);

const TEST_FILE_PATTERN = /\.test\.tsx?$/;

const UNRESTRICTED_DIRS = new Set(["components", "assets"]);

const LOADER_DECLARATION_PATTERN =
  /^export\s+(?:const|let|function|async\s+function)\s+([A-Za-z0-9_$]+)/gm;
const LOADER_EXPORT_LIST_PATTERN = /^export\s*\{([^}]*)\}/gm;
const LOADER_STAR_EXPORT_PATTERN = /^export\s*\*/m;

const offenders = [];
const loaderNameOffenders = [];

function loaderExportNames(source) {
  const names = [];
  for (const match of source.matchAll(LOADER_DECLARATION_PATTERN)) {
    names.push(match[1]);
  }
  for (const match of source.matchAll(LOADER_EXPORT_LIST_PATTERN)) {
    for (const entry of match[1].split(",")) {
      const trimmed = entry.trim();
      if (!trimmed || trimmed.startsWith("type ")) {
        continue;
      }
      // `local as exported` exports the alias; a bare name exports itself.
      const parts = trimmed.split(/\s+as\s+/);
      names.push(parts[parts.length - 1]);
    }
  }
  return names;
}

function checkLoaderExports(absolutePath, relativePath) {
  const source = fs.readFileSync(absolutePath, "utf8");
  if (LOADER_STAR_EXPORT_PATTERN.test(source)) {
    loaderNameOffenders.push(
      `${relativePath}: export * (names cannot be checked; export them explicitly)`,
    );
  }
  for (const name of loaderExportNames(source)) {
    if (!name.startsWith("load")) {
      loaderNameOffenders.push(`${relativePath}: ${name}`);
    }
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const absolutePath = path.join(dir, entry.name);
    const relativePath = path
      .relative(FEATURES_DIR, absolutePath)
      .split(path.sep)
      .join("/");
    if (entry.isDirectory()) {
      if (UNRESTRICTED_DIRS.has(entry.name)) {
        continue;
      }
      walk(absolutePath);
    } else if (
      !ALLOWED_FILES.has(entry.name) &&
      !TEST_FILE_PATTERN.test(entry.name)
    ) {
      offenders.push(relativePath);
    } else if (entry.name === "loaders.ts") {
      checkLoaderExports(absolutePath, relativePath);
    }
  }
}

for (const entry of fs.readdirSync(FEATURES_DIR, { withFileTypes: true })) {
  if (entry.name.startsWith(".")) {
    continue;
  }
  if (entry.isDirectory()) {
    walk(path.join(FEATURES_DIR, entry.name));
  } else {
    offenders.push(entry.name);
  }
}

if (offenders.length > 0) {
  console.error(
    `Found ${offenders.length} file(s) in apps/web/src/features/ that don't match the feature folder vocabulary:\n`,
  );
  for (const offender of offenders.sort()) {
    console.error(`  apps/web/src/features/${offender}`);
  }
  console.error(
    `\nAllowed files: ${[...ALLOWED_FILES].join(", ")}, *.test.ts, *.test.tsx`,
  );
  console.error(
    "Allowed directories: components/, assets/, or a sub-concern directory following the same vocabulary.",
  );
  console.error(
    "Move the file into components/, rename it to a vocabulary file, or extract it out of features/.",
  );
  process.exit(1);
}

if (loaderNameOffenders.length > 0) {
  console.error(
    `Found ${loaderNameOffenders.length} loader export(s) without the load* prefix:\n`,
  );
  for (const offender of loaderNameOffenders.sort()) {
    console.error(`  apps/web/src/features/${offender}`);
  }
  console.error(
    "\nEvery export from a loaders.ts is named load*. Loaders that redirect or throw take the bare prefix; loaders that return null for a missing actor are loadOptional*.",
  );
  process.exit(1);
}

console.log("Feature folder structure OK");
