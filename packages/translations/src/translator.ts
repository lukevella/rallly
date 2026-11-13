import * as z from "zod";
import type { Messages } from "./locales.ts";
import type { Glossary, TranslationItem } from "./prompt.ts";
import { buildSystem, buildUser } from "./prompt.ts";
import { validateTranslation } from "./validate.ts";

export const defaultModel = "gpt-5.6-luna";

export const serviceTier = "flex";

const chunkSize = 100;

export type Complete = (params: object) => Promise<{
  choices: {
    message: { content: string | null };
    finish_reason: string | null;
  }[];
}>;

const responseZod = z.object({
  translations: z.array(z.object({ key: z.string(), value: z.string() })),
});

const { $schema: _draft, ...responseSchema } = z.toJSONSchema(responseZod);

type Attempt =
  | { ok: true; values: Map<string, string> }
  | { ok: false; reason: string; final: boolean };

const stripFence = (content: string) =>
  content
    .trim()
    .replace(/^```[a-zA-Z]*\s*\n/, "")
    .replace(/\n?```$/, "")
    .trim();

const parseContent = (content: string | null | undefined): Attempt => {
  if (content === null || content === undefined || content.trim() === "") {
    return { ok: false, reason: "empty response content", final: false };
  }
  let json: unknown;
  try {
    json = JSON.parse(stripFence(content));
  } catch {
    return { ok: false, reason: "response was not valid JSON", final: false };
  }
  const parsed = responseZod.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "response did not match the schema",
      final: false,
    };
  }
  const values = new Map<string, string>();
  for (const { key, value } of parsed.data.translations) {
    if (!values.has(key)) values.set(key, value);
  }
  return { ok: true, values };
};

const request = async ({
  complete,
  model,
  system,
  items,
}: {
  complete: Complete;
  model: string;
  system: string;
  items: TranslationItem[];
}): Promise<Attempt> => {
  const response = await complete({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: buildUser({ items }) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "translations",
        strict: true,
        schema: responseSchema,
      },
    },
    service_tier: serviceTier,
  });
  const choice = response?.choices?.[0];
  if (!choice) {
    return { ok: false, reason: "response contained no choices", final: false };
  }
  if (choice.finish_reason === "length") {
    return {
      ok: false,
      reason: "response was cut off (finish_reason: length)",
      final: true,
    };
  }
  return parseContent(choice.message?.content);
};

const judge = ({
  items,
  attempt,
}: {
  items: TranslationItem[];
  attempt: Attempt;
}) => {
  const accepted: Messages = {};
  const rejected: TranslationItem[] = [];
  for (const item of items) {
    if (!attempt.ok) {
      rejected.push({
        key: item.key,
        source: item.source,
        error: attempt.reason,
      });
      continue;
    }
    const value = attempt.values.get(item.key);
    if (value === undefined) {
      rejected.push({
        key: item.key,
        source: item.source,
        error: "missing from response",
      });
      continue;
    }
    const reasons = validateTranslation({
      source: item.source,
      translation: value,
    });
    if (reasons.length === 0) {
      accepted[item.key] = value;
    } else {
      rejected.push({
        key: item.key,
        source: item.source,
        previous: value,
        error: reasons.join("; "),
      });
    }
  }
  return { accepted, rejected };
};

const translateGroup = async ({
  complete,
  model,
  system,
  items,
  canSplit,
}: {
  complete: Complete;
  model: string;
  system: string;
  items: TranslationItem[];
  canSplit: boolean;
}): Promise<{
  translated: Messages;
  failed: { key: string; reason: string }[];
}> => {
  const first = await request({ complete, model, system, items });
  if (!first.ok && first.final) {
    if (!canSplit || items.length < 2) {
      return {
        translated: {},
        failed: items.map(({ key }) => ({ key, reason: first.reason })),
      };
    }
    const middle = Math.ceil(items.length / 2);
    const halves = [items.slice(0, middle), items.slice(middle)];
    const translated: Messages = {};
    const failed: { key: string; reason: string }[] = [];
    for (const half of halves) {
      const result = await translateGroup({
        complete,
        model,
        system,
        items: half,
        canSplit: false,
      });
      Object.assign(translated, result.translated);
      failed.push(...result.failed);
    }
    return { translated, failed };
  }

  const firstPass = judge({ items, attempt: first });
  if (firstPass.rejected.length === 0) {
    return { translated: firstPass.accepted, failed: [] };
  }

  const second = await request({
    complete,
    model,
    system,
    items: firstPass.rejected,
  });
  const secondPass = judge({ items: firstPass.rejected, attempt: second });

  return {
    translated: { ...firstPass.accepted, ...secondPass.accepted },
    failed: secondPass.rejected.map(({ key, error }) => ({
      key,
      reason: error ?? "unknown error",
    })),
  };
};

export const translateItems = async ({
  complete,
  model,
  locale,
  glossary,
  reference,
  items,
}: {
  complete: Complete;
  model: string;
  locale: string;
  glossary: Glossary;
  reference: Messages;
  items: TranslationItem[];
}) => {
  const system = buildSystem({ locale, glossary, reference });
  const translated: Messages = {};
  const failed: { key: string; reason: string }[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const result = await translateGroup({
      complete,
      model,
      system,
      items: items.slice(i, i + chunkSize),
      canSplit: true,
    });
    Object.assign(translated, result.translated);
    failed.push(...result.failed);
  }

  return { translated, failed };
};
