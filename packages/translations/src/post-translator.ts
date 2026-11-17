import matter from "gray-matter";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import * as z from "zod";
import { validatePost } from "./post-validate.ts";
import type { Glossary } from "./prompt.ts";
import { buildPostSystem } from "./prompt.ts";
import type { Complete } from "./translator.ts";
import {
  errorMessage,
  protectedTermReasons,
  serviceTier,
  stripFence,
} from "./translator.ts";

type Part = "title" | "excerpt" | "body";

type Parts = Partial<Record<Part, string>> & { body: string };

const schemaFor = (present: Part[]) => {
  const zod = z.object(
    Object.fromEntries(present.map((part) => [part, z.string()])),
  );
  const { $schema: _draft, ...schema } = z.toJSONSchema(zod);
  return { zod, schema };
};

type Attempt =
  | { ok: true; parts: Parts }
  | { ok: false; reason: string; final: boolean };

const parseContent = ({
  content,
  zod,
}: {
  content: string | null | undefined;
  zod: z.ZodType<Record<string, string>>;
}): Attempt => {
  if (content === null || content === undefined || content.trim() === "") {
    return { ok: false, reason: "empty response content", final: false };
  }
  let json: unknown;
  try {
    json = JSON.parse(stripFence(content));
  } catch {
    return { ok: false, reason: "response was not valid JSON", final: false };
  }
  const parsed = zod.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "response did not match the schema",
      final: false,
    };
  }
  return { ok: true, parts: parsed.data as Parts };
};

const request = async ({
  complete,
  model,
  system,
  user,
  schema,
}: {
  complete: Complete;
  model: string;
  system: string;
  user: Record<string, string>;
  schema: ReturnType<typeof schemaFor>;
}): Promise<Attempt> => {
  const response = await complete({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(user) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "post", strict: true, schema: schema.schema },
    },
    service_tier: serviceTier,
  } satisfies ChatCompletionCreateParamsNonStreaming);
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
  return parseContent({ content: choice.message?.content, zod: schema.zod });
};

export const translatePost = async ({
  complete,
  model,
  locale,
  glossary,
  source,
  previous,
}: {
  complete: Complete;
  model: string;
  locale: string;
  glossary: Glossary;
  source: string;
  previous?: string;
}): Promise<{ ok: true; content: string } | { ok: false; reason: string }> => {
  const system = buildPostSystem({ locale, glossary });
  const english = matter(source);
  const englishParts: Parts = {
    ...("title" in english.data && { title: String(english.data.title ?? "") }),
    ...("excerpt" in english.data && {
      excerpt: String(english.data.excerpt ?? ""),
    }),
    body: english.content,
  };
  const present = Object.keys(englishParts) as Part[];
  const schema = schemaFor(present);

  const judge = (
    attempt: Attempt,
  ):
    | { ok: true; content: string }
    | { ok: false; reason: string; rejected?: string } => {
    if (!attempt.ok) return { ok: false, reason: attempt.reason };
    const { parts } = attempt;
    const content = matter.stringify(parts.body, {
      ...english.data,
      ...(parts.title !== undefined && { title: parts.title }),
      ...(parts.excerpt !== undefined && { excerpt: parts.excerpt }),
    });
    const reasons = [
      ...validatePost({ source, translation: content }),
      ...present.flatMap((part) =>
        protectedTermReasons({
          protectedTerms: glossary.doNotTranslate,
          source: englishParts[part] ?? "",
          translation: parts[part] ?? "",
        }),
      ),
    ];
    if (reasons.length === 0) return { ok: true, content };
    return { ok: false, reason: reasons.join("; "), rejected: content };
  };

  const attempt = async (user: Record<string, string>) => {
    try {
      return await request({ complete, model, system, user, schema });
    } catch (error) {
      return { ok: false, reason: errorMessage(error), final: true } as const;
    }
  };

  const first = await attempt({
    ...englishParts,
    ...(previous !== undefined && { previous }),
  });
  if (!first.ok && first.final) return { ok: false, reason: first.reason };
  const firstJudged = judge(first);
  if (firstJudged.ok) return firstJudged;

  const second = await attempt({
    ...englishParts,
    ...(firstJudged.rejected !== undefined && {
      previous: firstJudged.rejected,
    }),
    error: firstJudged.reason,
  });
  if (!second.ok && second.final) return { ok: false, reason: second.reason };
  const secondJudged = judge(second);
  if (secondJudged.ok) return secondJudged;
  return { ok: false, reason: secondJudged.reason };
};
