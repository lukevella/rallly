import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as z from "zod";
import type { Messages } from "./locales.ts";

const glossarySchema = z.object({
  doNotTranslate: z.array(z.string()),
  terms: z.array(
    z.object({
      en: z.string(),
      note: z.string(),
      translations: z.record(z.string(), z.string()),
    }),
  ),
});

export type Glossary = z.infer<typeof glossarySchema>;

export type TranslationItem = {
  key: string;
  source: string;
  previous?: string;
  error?: string;
};

export const languageNames: Record<string, string> = {
  cs: "Czech",
  da: "Danish",
  de: "German",
  es: "Spanish (Spain)",
  fi: "Finnish",
  fr: "French",
  hu: "Hungarian",
  it: "Italian",
  nl: "Dutch",
  no: "Norwegian Bokmål",
  pl: "Polish",
  "pt-BR": "Brazilian Portuguese",
  "pt-PT": "European Portuguese (Portugal)",
  ru: "Russian",
  sv: "Swedish",
  zh: "Simplified Chinese",
  "zh-Hant": "Traditional Chinese (Taiwan)",
};

export const languageName = (locale: string) => {
  const name = Object.entries(languageNames).find(
    ([key]) => key === locale,
  )?.[1];
  if (!name) {
    throw new Error(
      `Unknown locale "${locale}": add it to languageNames in prompt.ts`,
    );
  }
  return name;
};

export const loadGlossary = ({ repoRoot }: { repoRoot: string }) => {
  const path = join(repoRoot, "i18n", "glossary.json");
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    throw new Error(`Glossary not found at ${path}`);
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Glossary at ${path} is not valid JSON`);
  }
  const parsed = glossarySchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Glossary at ${path} is malformed: ${parsed.error.message}`,
    );
  }
  return parsed.data;
};

const glossaryLines = ({
  locale,
  glossary,
}: {
  locale: string;
  glossary: Glossary;
}) =>
  glossary.terms.map((term) => {
    const translation = Object.entries(term.translations).find(
      ([key]) => key === locale,
    )?.[1];
    return translation
      ? `- "${term.en}" → "${translation}" (${term.note})`
      : `- "${term.en}" (${term.note}). No fixed translation: pick the natural term and use it consistently.`;
  });

const categoryQuota = 30;

const categories = [
  /\{[^{}]+,\s*(?:plural|selectordinal|select)\s*,/,
  /<\/?[A-Za-z0-9]+[^<>]*>/,
  /\{\s*[A-Za-z0-9_]+\s*\}/,
];

const spread = <T>({ items, count }: { items: T[]; count: number }) =>
  count >= items.length
    ? items
    : Array.from(
        { length: count },
        (_, i) => items[Math.floor(((i + 0.5) * items.length) / count)],
      ).filter((item): item is T => item !== undefined);

const byLength = (a: [string, string], b: [string, string]) =>
  a[1].length - b[1].length || (a[0] < b[0] ? -1 : 1);

export const sampleReference = ({
  reference,
  limit = 150,
}: {
  reference: Messages;
  limit?: number;
}) => {
  const entries = Object.entries(reference);
  if (entries.length <= limit) return reference;

  const sorted = entries.sort(byLength);
  const buckets = categories.map(() => [] as [string, string][]);
  const ordinary: [string, string][] = [];
  for (const entry of sorted) {
    const index = categories.findIndex((pattern) => pattern.test(entry[1]));
    (buckets[index] ?? ordinary).push(entry);
  }

  const picked = new Set<[string, string]>();
  for (const bucket of buckets) {
    for (const entry of spread({ items: bucket, count: categoryQuota })) {
      picked.add(entry);
    }
  }
  for (const entry of spread({
    items: ordinary,
    count: limit - picked.size,
  })) {
    picked.add(entry);
  }
  if (picked.size < limit) {
    const rest = sorted.filter((entry) => !picked.has(entry));
    for (const entry of spread({ items: rest, count: limit - picked.size })) {
      picked.add(entry);
    }
  }

  return Object.fromEntries(picked);
};

export const productBrief = `Rallly helps a group find a time to meet.
- An organizer creates a poll that proposes several dates or times (options) and shares a link to it.
- Participants open the link and vote on each option: yes, if need be (works but not ideal) or no. A participant does not need an account; one set of votes is their response.
- The organizer sees everyone's availability and finalizes the poll by picking one option. That creates a scheduled event, and participants can be notified and add it to their calendar.
- Participants can leave comments on a poll.
- Polls and events belong to a space: a workspace shared by a team. People in a space are members. A paid Pro subscription is billed per seat, one seat per member.
- The audience is everyday users organizing meetings, clubs, committees and classes, so prefer plain, friendly wording over technical or formal terms.`;

export const buildSystem = ({
  locale,
  glossary,
  reference,
}: {
  locale: string;
  glossary: Glossary;
  reference: Messages;
}) => {
  const language = languageName(locale);

  return [
    `You are a professional translator localizing the user interface of Rallly, a meeting scheduling app, from English into ${language} (${locale}).`,
    `## About Rallly
${productBrief}
- Strings are short interface labels, buttons, messages and emails. Keep translations about as concise as the English.`,
    `## Rules
- Keep every ICU argument (such as {name}), plural and select structure, and tag name (such as <b>) exactly as in the source.
- Select option keys are identifiers and must never be translated.
- Plural categories must be the ones the target language needs.
- Every plural and every select must include an \`other\` case.
- Translate only the human-readable text.
- Never translate these terms: ${glossary.doNotTranslate.join(", ")}.
- Follow ${language}'s own capitalization conventions rather than copying English capitalization.
- Return every requested key.`,
    `## Glossary
Use these terms consistently.
${glossaryLines({ locale, glossary }).join("\n")}`,
    `## Existing translations
These are already translated in ${language}. Match their terminology and tone.
${JSON.stringify(sampleReference({ reference }), null, 2)}`,
  ].join("\n\n");
};

export const buildUser = ({ items }: { items: TranslationItem[] }) =>
  JSON.stringify(
    items.map(({ key, source, previous, error }) => ({
      key,
      source,
      ...(previous !== undefined && { previous }),
      ...(error !== undefined && { error }),
    })),
  );

export const buildPostSystem = ({
  locale,
  glossary,
}: {
  locale: string;
  glossary: Glossary;
}) => {
  const language = languageName(locale);

  return [
    `You are a professional translator localizing a blog post of Rallly, a meeting scheduling app, from English into ${language} (${locale}).`,
    `## About Rallly
${productBrief}`,
    `## Rules
- Keep Markdown and MDX syntax, URLs, code, component names and props exactly as in the source.
- Translate the text of the \`question\` attribute.
- Never translate these terms: ${glossary.doNotTranslate.join(", ")}.
- Follow ${language}'s own capitalization conventions rather than copying English capitalization.
- Keep the author's voice: plain and direct.
- This is a long-form article. Translate every sentence; do not shorten, summarise or omit anything.
- \`previous\`, when present, is an earlier translation of this post: reuse its wording where it is still correct.
- \`error\`, when present, lists why your last answer was rejected: fix every point.
- Do not introduce \`<\`, \`{\` or \`}\` into prose; they have special meaning in MDX.
- Return every part you were given (\`title\`, \`excerpt\` when present, and \`body\`).`,
    `## Glossary
Use these terms consistently.
${glossaryLines({ locale, glossary }).join("\n")}`,
  ].join("\n\n");
};
