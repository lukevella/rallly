#!/usr/bin/env node
/**
 * Fails when a locale JSON string has unbalanced braces.
 *
 * Crowdin's machine translation batches occasionally bleed ICU plural join
 * tokens onto neighboring strings, leaving artifacts like `},{`, `}]}{` or a
 * trailing `}]` in translated values. Balanced-brace counting catches every
 * observed artifact shape without false-positiving on valid ICU messages
 * (none of our locales use ICU apostrophe-escaped literal braces).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const LOCALE_DIRS = [
  "apps/web/public/locales",
  "apps/landing/public/locales",
  "packages/emails/locales",
];

function hasUnbalancedBraces(value) {
  let depth = 0;
  for (const char of value) {
    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth < 0) {
        return true;
      }
    }
  }
  return depth !== 0;
}

function collectOffenders(node, keyPath, offenders) {
  if (typeof node === "string") {
    if (hasUnbalancedBraces(node)) {
      offenders.push({ keyPath, value: node });
    }
  } else if (node !== null && typeof node === "object") {
    for (const [key, child] of Object.entries(node)) {
      collectOffenders(child, keyPath ? `${keyPath}.${key}` : key, offenders);
    }
  }
}

function* walkJsonFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkJsonFiles(absolutePath);
    } else if (entry.name.endsWith(".json")) {
      yield absolutePath;
    }
  }
}

let offenderCount = 0;

for (const localeDir of LOCALE_DIRS) {
  for (const filePath of walkJsonFiles(path.join(ROOT, localeDir))) {
    const relativePath = path
      .relative(ROOT, filePath)
      .split(path.sep)
      .join("/");
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      offenderCount++;
      console.error(`${relativePath}: invalid JSON (${error.message})`);
      continue;
    }
    const offenders = [];
    collectOffenders(parsed, "", offenders);
    for (const { keyPath, value } of offenders) {
      offenderCount++;
      console.error(`${relativePath} → ${keyPath}: ${JSON.stringify(value)}`);
    }
  }
}

if (offenderCount > 0) {
  console.error(
    `\nFound ${offenderCount} locale string(s) with unbalanced braces.`,
  );
  console.error(
    "These are usually Crowdin machine-translation artifacts (stray `},{` or `}]` fragments).",
  );
  console.error("Fix the string in Crowdin and re-sync.");
  process.exit(1);
}

console.log("Locale brace balance OK");
