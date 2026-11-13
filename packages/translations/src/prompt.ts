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
  ru: "Russian",
  sv: "Swedish",
  zh: "Simplified Chinese",
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
    `## Rules
- Keep every ICU argument (such as {name}), plural and select structure, and tag name (such as <b>) exactly as in the source.
- Select option keys are identifiers and must never be translated.
- Plural categories must be the ones the target language needs, and must always include \`other\`.
- Translate only the human-readable text.
- Never translate these terms: ${glossary.doNotTranslate.join(", ")}.
- Follow ${language}'s own capitalization conventions rather than copying English capitalization.
- Return every requested key.`,
    `## Glossary
Use these terms consistently.
${glossaryLines({ locale, glossary }).join("\n")}`,
    `## Existing translations
These are already translated in ${language}. Match their terminology and tone.
${JSON.stringify(reference, null, 2)}`,
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
