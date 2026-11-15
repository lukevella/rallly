import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import OpenAI from "openai";
import { Agent } from "undici";
import { formatReport, run, shouldFail } from "./run.ts";
import type { Complete } from "./translator.ts";
import { defaultModel } from "./translator.ts";

const repoRoot = resolve(import.meta.dirname, "../../..");
const envFile = join(import.meta.dirname, "..", ".env.local");
const keyName = "OPENAI_API_KEY";

const fail = (message: string): never => {
  console.error(message);
  process.exit(2);
};

const readEnvFile = () => {
  if (!existsSync(envFile)) return {};
  const values: Record<string, string> = {};
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(
      /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/,
    );
    if (!match) continue;
    values[match[1] as string] = (match[2] as string)
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
  }
  return values;
};

const loadApiKey = () => {
  const apiKey = process.env[keyName] || readEnvFile()[keyName];
  if (!apiKey) {
    return fail(`${keyName} is not set. Export it or add it to ${envFile}`);
  }
  return apiKey;
};

const { values } = parseArgs({
  options: {
    locale: { type: "string", multiple: true },
    file: { type: "string", multiple: true },
    "dry-run": { type: "boolean" },
    report: { type: "string" },
    model: { type: "string" },
  },
});

for (const file of values.file ?? []) {
  if (!/^[^/]+\/[^/]+$/.test(file)) {
    fail(`--file expects <rootId>/<namespace>, got "${file}"`);
  }
}

const apiKey = loadApiKey();
const timeout = 15 * 60 * 1000;
// Node's bundled fetch stops waiting for headers after 300 seconds, well short
// of a slow flex request, so the dispatcher carries the SDK timeout instead.
const client = new OpenAI({
  apiKey,
  timeout,
  maxRetries: 5,
  fetchOptions: {
    dispatcher: new Agent({ headersTimeout: timeout, bodyTimeout: timeout }),
  },
});

const redact = (text: string) => text.split(apiKey).join("[redacted]");

const complete: Complete = async (params) => {
  try {
    return await client.chat.completions.create(params);
  } catch (error) {
    throw new Error(
      redact(error instanceof Error ? error.message : "request failed"),
    );
  }
};

const model = values.model || process.env.TRANSLATION_MODEL || defaultModel;

console.error(`Model: ${model}`);

const report = await run({
  repoRoot,
  complete,
  model,
  locales: values.locale,
  files: values.file,
  dryRun: values["dry-run"],
});

if (report.files.length === 0) fail("No locale files matched the filters");

const markdown = formatReport(report);
console.log(markdown);
if (values.report) writeFileSync(values.report, markdown);

process.exit(shouldFail(report) ? 1 : 0);
