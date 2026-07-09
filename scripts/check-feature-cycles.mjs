#!/usr/bin/env node
/**
 * Fails on circular imports between features in apps/web/src/features/.
 *
 * Builds a feature-level import graph from `@/features/<name>/...` specifiers
 * (and relative imports that cross a feature boundary), then reports any
 * strongly connected component involving more than one feature.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FEATURES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/web/src/features",
);

// Feature pairs that are currently cyclic. This list only shrinks — do not
// add to it. Tracked by RAL-1287 / RAL-1288. Each entry is a sorted
// "a <-> b" pair; only NEW cycles fail the check.
const GRANDFATHERED_CYCLES = new Set([
  "billing <-> space",
  "branding <-> space",
]);

const SOURCE_FILE_PATTERN = /\.(ts|tsx)$/;
const IMPORT_PATTERN =
  /(?:from|import\s*\(|require\s*\(|^\s*import)\s*["']([^"']+)["']/gm;

function collectSourceFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(absolutePath, files);
    } else if (SOURCE_FILE_PATTERN.test(entry.name)) {
      files.push(absolutePath);
    }
  }
  return files;
}

function featureOfPath(absolutePath) {
  const relativePath = path.relative(FEATURES_DIR, absolutePath);
  if (relativePath.startsWith("..")) {
    return null;
  }
  return relativePath.split(path.sep)[0];
}

function featureOfImport({ specifier, importerDir }) {
  const aliasMatch = specifier.match(/^@\/features\/([^/]+)/);
  if (aliasMatch) {
    return aliasMatch[1];
  }
  if (specifier.startsWith(".")) {
    return featureOfPath(path.resolve(importerDir, specifier));
  }
  return null;
}

const edges = new Map();

for (const file of collectSourceFiles(FEATURES_DIR)) {
  const importerFeature = featureOfPath(file);
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const importedFeature = featureOfImport({
      specifier: match[1],
      importerDir: path.dirname(file),
    });
    if (importedFeature && importedFeature !== importerFeature) {
      if (!edges.has(importerFeature)) {
        edges.set(importerFeature, new Set());
      }
      edges.get(importerFeature).add(importedFeature);
    }
  }
}

// Tarjan's strongly connected components
let index = 0;
const nodeIndex = new Map();
const lowLink = new Map();
const onStack = new Set();
const stack = [];
const cyclicGroups = [];

function strongConnect(node) {
  nodeIndex.set(node, index);
  lowLink.set(node, index);
  index += 1;
  stack.push(node);
  onStack.add(node);

  for (const neighbor of edges.get(node) ?? []) {
    if (!edges.has(neighbor) && !nodeIndex.has(neighbor)) {
      nodeIndex.set(neighbor, index);
      lowLink.set(neighbor, index);
      index += 1;
      continue;
    }
    if (!nodeIndex.has(neighbor)) {
      strongConnect(neighbor);
      lowLink.set(node, Math.min(lowLink.get(node), lowLink.get(neighbor)));
    } else if (onStack.has(neighbor)) {
      lowLink.set(node, Math.min(lowLink.get(node), nodeIndex.get(neighbor)));
    }
  }

  if (lowLink.get(node) === nodeIndex.get(node)) {
    const group = [];
    let member;
    do {
      member = stack.pop();
      onStack.delete(member);
      group.push(member);
    } while (member !== node);
    if (group.length > 1) {
      cyclicGroups.push(group.sort());
    }
  }
}

for (const node of edges.keys()) {
  if (!nodeIndex.has(node)) {
    strongConnect(node);
  }
}

const newCycles = [];
for (const group of cyclicGroups) {
  const pairs = [];
  for (const a of group) {
    for (const b of edges.get(a) ?? []) {
      if (group.includes(b)) {
        pairs.push([a, b].sort().join(" <-> "));
      }
    }
  }
  const isGrandfathered = pairs.every((pair) => GRANDFATHERED_CYCLES.has(pair));
  const label = `[${group.join(", ")}]`;
  if (isGrandfathered) {
    console.warn(`Grandfathered feature cycle (tracked by RAL-1287): ${label}`);
  } else {
    newCycles.push(label);
  }
}

if (newCycles.length > 0) {
  console.error("Found circular imports between features:\n");
  for (const cycle of newCycles) {
    console.error(`  ${cycle}`);
  }
  console.error(
    "\nFeatures must not import from each other in both directions.",
  );
  console.error(
    "Break the cycle by extracting shared code or inverting the dependency.",
  );
  process.exit(1);
}

console.log("No new circular imports between features");
