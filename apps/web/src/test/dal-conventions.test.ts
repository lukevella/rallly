import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC_DIR = path.resolve(__dirname, "..");

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(fullPath);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

const sourceFiles = listSourceFiles(SRC_DIR);
const relative = (file: string) =>
  path.relative(SRC_DIR, file).replaceAll(path.sep, "/");

// Modules allowed to mint the brand: the session gate and the API key
// middleware. Everything else must receive an AuthorizedSpaceId, never cast.
const AUTHORIZED_SPACE_ID_PRODUCERS = new Set([
  "features/space/data.ts",
  "app/api/private/utils/api-key.ts",
]);

const ALWAYS_ALLOWED_ENV_VARS = new Set(["NODE_ENV", "NEXT_RUNTIME"]);

// Migration allowlist (RAL-1333): these predate the rule. Shrink by moving
// reads into @/env or lib/; never add to this list.
const PROCESS_ENV_ALLOWLIST = new Set([
  "app/api/house-keeping/[...method]/route.ts",
  "app/api/stripe/webhook/route.ts",
  "features/auth/utils.ts",
  "features/calendars/constants.ts",
  "features/quick-create/constants.ts",
  "features/scheduled-event/constants.ts",
  "features/setup/utils.ts",
]);

describe("DAL conventions (RAL-1333)", () => {
  it('starts data.ts, mutations.ts and service.ts with `import "server-only"`', () => {
    const dalFiles = sourceFiles.filter((file) => {
      const rel = relative(file);
      return (
        rel.startsWith("features/") &&
        /(^|\/)(data|mutations|service)\.ts$/.test(rel) &&
        !rel.includes("/components/")
      );
    });

    expect(dalFiles.length).toBeGreaterThan(0);

    const violations = dalFiles.filter(
      (file) =>
        !fs
          .readFileSync(file, "utf8")
          .trimStart()
          .startsWith('import "server-only";'),
    );

    expect(violations.map(relative)).toEqual([]);
  });

  it("only lets the session gate and API key middleware mint AuthorizedSpaceId", () => {
    const violations = sourceFiles.filter((file) => {
      const rel = relative(file);
      if (AUTHORIZED_SPACE_ID_PRODUCERS.has(rel) || /\.test\.tsx?$/.test(rel)) {
        return false;
      }
      return fs.readFileSync(file, "utf8").includes("as AuthorizedSpaceId");
    });

    expect(violations.map(relative)).toEqual([]);
  });

  it("confines process.env access to env.ts and lib/", () => {
    const violations: string[] = [];

    for (const file of sourceFiles) {
      const rel = relative(file);
      if (
        rel === "env.ts" ||
        rel.startsWith("lib/") ||
        rel.startsWith("test/") ||
        /\.test\.tsx?$/.test(rel) ||
        PROCESS_ENV_ALLOWLIST.has(rel)
      ) {
        continue;
      }

      const content = fs.readFileSync(file, "utf8");
      for (const match of content.matchAll(/process\.env\.(\w+)/g)) {
        const name = match[1];
        if (
          name &&
          !name.startsWith("NEXT_PUBLIC_") &&
          !ALWAYS_ALLOWED_ENV_VARS.has(name)
        ) {
          violations.push(`${rel} (${name})`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
