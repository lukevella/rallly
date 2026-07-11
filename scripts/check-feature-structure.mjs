#!/usr/bin/env node
/**
 * Enforces the file vocabulary for apps/web/src/features/.
 *
 * Every feature directory (and any sub-concern directory within it) may only
 * contain the allowed file names below, co-located tests, and the directories
 * `components/` and `assets/` (whose contents are unrestricted).
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
  "mutations.ts",
  "actions.ts",
  "schema.ts",
  "types.ts",
  "ability.ts",
  "constants.ts",
  "utils.ts",
  "client.tsx",
]);

const TEST_FILE_PATTERN = /\.test\.tsx?$/;

const UNRESTRICTED_DIRS = new Set(["components", "assets"]);

// Grandfathered exceptions. This list only shrinks — do not add to it.
// Tracked by RAL-1287 / RAL-1288. Paths are relative to
// apps/web/src/features/; entries ending in "/" exempt a whole directory.
const GRANDFATHERED = [
  "analytics/posthog.ts",
  "calendars/service.ts",
  "calendars/services/",
  "google/service.ts",
  "navigation/config.tsx",
];

const usedGrandfatherEntries = new Set();

function isGrandfathered(relativePath) {
  for (const entry of GRANDFATHERED) {
    if (
      entry === relativePath ||
      (entry.endsWith("/") && relativePath.startsWith(entry))
    ) {
      usedGrandfatherEntries.add(entry);
      return true;
    }
  }
  return false;
}

const offenders = [];

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
      if (isGrandfathered(`${relativePath}/`)) {
        continue;
      }
      walk(absolutePath);
    } else if (
      !ALLOWED_FILES.has(entry.name) &&
      !TEST_FILE_PATTERN.test(entry.name) &&
      !isGrandfathered(relativePath)
    ) {
      offenders.push(relativePath);
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

const staleEntries = GRANDFATHERED.filter(
  (entry) => !usedGrandfatherEntries.has(entry),
);
if (staleEntries.length > 0) {
  console.warn(
    "Warning: stale grandfather entries in scripts/check-feature-structure.mjs (remove them):",
  );
  for (const entry of staleEntries) {
    console.warn(`  ${entry}`);
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

console.log("Feature folder structure OK");
