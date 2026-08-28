#!/usr/bin/env node
/**
 * Fails when a `onDelete: Cascade` relation on `User` is not accounted for by
 * the orphaned-anonymous-guest purge.
 *
 * `deleteOrphanedAnonymousUsers` deletes guest accounts outright, so every
 * cascading relation on `User` is inside its blast radius. Whether that is
 * safe is a per-relation judgement, and the purge only encodes half of it:
 * the relations it filters on. Nothing recorded the relations it deliberately
 * ignores, so a newly added cascade was indistinguishable from an overlooked
 * one — and the recurring cron runs unattended.
 *
 * Every cascading relation must therefore land in exactly one bucket:
 *
 *  - guarded — named in the purge filter, so a guest owning one is retained.
 *  - ignored — provably not user data worth keeping, with the reason stated
 *    below. These MUST NOT be added to the purge filter: an anonymous guest
 *    always has a session and account row, so filtering on those would make
 *    the purge match nothing at all.
 *
 * A relation in neither bucket fails this check. Classify it: if deleting it
 * along with the guest would destroy something, add it to the purge filter;
 * if not, add it to IGNORED_RELATIONS with the reason why.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const MODELS_DIR = path.join(ROOT, "packages/database/prisma/models");
const PURGE_FILE = path.join(ROOT, "apps/web/src/features/user/mutations.ts");
const PURGE_FUNCTION = "deleteOrphanedAnonymousUsers";

// Cascading relations that are intentionally NOT guarded by the purge filter,
// each with the reason it carries no data worth retaining. Keyed by the field
// name on the `User` model.
const IGNORED_RELATIONS = new Map([
  [
    "sessions",
    "Auth plumbing. Every anonymous guest has one by definition — filtering on it would make the purge match nothing. The lastSeenAt cutoff is the liveness guard instead.",
  ],
  [
    "accounts",
    "Auth plumbing, created alongside the guest account. Carries no user-authored data.",
  ],
  [
    "notificationPreferences",
    "Per-user settings, meaningless once the account is gone.",
  ],
]);

/**
 * The `User` back-relation field for each cascading relation, resolved from
 * the `User` model's own field list. Prisma names the two sides
 * independently, and the purge filter uses the `User` side.
 */
function parseUserModelFields(userModelBody) {
  const fields = new Map();
  for (const line of userModelBody.split("\n")) {
    const match = line
      .trim()
      .match(/^(\w+)\s+(\w+)(\[\])?\??(\s+@relation\("([^"]+)"[^)]*\))?/);
    if (!match) {
      continue;
    }
    const [, fieldName, fieldType, , , relationName] = match;
    fields.set(fieldName, { fieldType, relationName });
  }
  return fields;
}

function readModelBodies(source) {
  const models = new Map();
  const pattern = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  for (const match of source.matchAll(pattern)) {
    models.set(match[1], match[2]);
  }
  return models;
}

const allModels = new Map();

for (const entry of fs.readdirSync(MODELS_DIR)) {
  if (!entry.endsWith(".prisma")) {
    continue;
  }
  const source = fs.readFileSync(path.join(MODELS_DIR, entry), "utf8");
  for (const [modelName, body] of readModelBodies(source)) {
    allModels.set(modelName, { body, file: entry });
  }
}

const userModel = allModels.get("User");

if (!userModel) {
  console.error("Could not find the `User` model in the Prisma schema.");
  process.exit(1);
}

const userFields = parseUserModelFields(userModel.body);

// Collect every relation that cascades from `User`, then map each back to the
// field on `User` that the purge filter would have to name.
const cascadingRelations = [];

for (const [modelName, { body, file }] of allModels) {
  for (const line of body.split("\n")) {
    const relationMatch = line.match(
      /^\s*(\w+)\s+User(\[\])?\??\s+@relation\(([^)]*)\)/,
    );
    if (!relationMatch) {
      continue;
    }
    const args = relationMatch[3];
    if (!args.includes("onDelete: Cascade")) {
      continue;
    }

    const relationNameMatch = args.match(/^\s*"([^"]+)"/);
    const relationName = relationNameMatch ? relationNameMatch[1] : null;

    // Find the field on `User` that points back at this model. Named
    // relations disambiguate when a model relates to `User` more than once.
    let userField = null;
    for (const [fieldName, field] of userFields) {
      if (field.fieldType !== modelName) {
        continue;
      }
      if (relationName && field.relationName !== relationName) {
        continue;
      }
      if (!relationName && field.relationName) {
        continue;
      }
      userField = fieldName;
      break;
    }

    cascadingRelations.push({
      model: modelName,
      file,
      field: relationMatch[1],
      userField,
      relationName,
    });
  }
}

if (cascadingRelations.length === 0) {
  console.error(
    "Found no cascading `User` relations — the schema parser is probably broken.",
  );
  process.exit(1);
}

// Extract the purge function body and read the relations it filters on. Only
// `<relation>: { none: {} }` counts: that is the shape that retains a guest
// who owns one.
const purgeSource = fs.readFileSync(PURGE_FILE, "utf8");
const purgeStart = purgeSource.indexOf(
  `export async function ${PURGE_FUNCTION}`,
);

if (purgeStart === -1) {
  console.error(
    `Could not find \`${PURGE_FUNCTION}\` in ${path.relative(ROOT, PURGE_FILE)}.`,
  );
  console.error(
    "If it was renamed or moved, update PURGE_FILE/PURGE_FUNCTION in this script.",
  );
  process.exit(1);
}

// Bound the slice to this function so a `none: {}` in a later one can't be
// mistaken for a guard.
const nextExportOffset = purgeSource.slice(purgeStart + 1).indexOf("\nexport ");
const purgeBody = purgeSource.slice(
  purgeStart,
  nextExportOffset === -1 ? undefined : purgeStart + 1 + nextExportOffset,
);

const guardedRelations = new Set(
  [...purgeBody.matchAll(/(\w+)\s*:\s*\{\s*none\s*:\s*\{\s*\}\s*\}/g)].map(
    (match) => match[1],
  ),
);

if (guardedRelations.size === 0) {
  console.error(
    `Found no \`<relation>: { none: {} }\` guards in \`${PURGE_FUNCTION}\`.`,
  );
  console.error(
    "Either the filter lost its guards or this script can no longer parse it.",
  );
  process.exit(1);
}

const unclassified = [];
const unresolved = [];

for (const relation of cascadingRelations) {
  if (!relation.userField) {
    unresolved.push(relation);
    continue;
  }
  if (guardedRelations.has(relation.userField)) {
    continue;
  }
  if (IGNORED_RELATIONS.has(relation.userField)) {
    continue;
  }
  unclassified.push(relation);
}

// A guarded relation that no longer cascades is stale — either the schema
// changed or the filter names something that isn't a cascade.
const cascadingUserFields = new Set(
  cascadingRelations.map((relation) => relation.userField).filter(Boolean),
);

const staleIgnores = [...IGNORED_RELATIONS.keys()].filter(
  (field) => !cascadingUserFields.has(field),
);

let failed = false;

if (unresolved.length > 0) {
  failed = true;
  console.error(
    "Could not resolve the `User` field for these cascading relations:\n",
  );
  for (const relation of unresolved) {
    console.error(`  ${relation.model}.${relation.field} (${relation.file})`);
  }
  console.error(
    "\nThis is a parser limitation — check the relation is declared on the `User` model.",
  );
}

if (unclassified.length > 0) {
  failed = true;
  console.error(
    "These `onDelete: Cascade` relations on `User` are not accounted for by the",
  );
  console.error(`orphaned-guest purge (\`${PURGE_FUNCTION}\`):\n`);
  for (const relation of unclassified) {
    console.error(
      `  User.${relation.userField} → ${relation.model}.${relation.field} (${relation.file})`,
    );
  }
  console.error(
    "\nThe purge deletes anonymous guests outright, so each of these cascades with them.",
  );
  console.error("Decide which it is, then record the decision:\n");
  console.error("  - Deleting it with the guest would destroy data → add");
  console.error(
    `    \`${unclassified[0].userField}: { none: {} }\` to the purge filter in`,
  );
  console.error(`    ${path.relative(ROOT, PURGE_FILE)}.`);
  console.error(
    "  - It holds nothing worth keeping → add it to IGNORED_RELATIONS in this",
  );
  console.error("    script, with the reason.");
}

if (staleIgnores.length > 0) {
  failed = true;
  console.error(
    "\nThese entries in IGNORED_RELATIONS no longer match a cascading `User` relation:\n",
  );
  for (const field of staleIgnores) {
    console.error(`  ${field}`);
  }
  console.error("\nRemove them — the relation was renamed or dropped.");
}

if (failed) {
  process.exit(1);
}

console.log(
  `All ${cascadingRelations.length} cascading \`User\` relations are accounted for by ${PURGE_FUNCTION} (${guardedRelations.size} guarded, ${IGNORED_RELATIONS.size} ignored)`,
);
