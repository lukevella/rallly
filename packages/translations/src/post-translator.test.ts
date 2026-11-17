import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { translatePost } from "./post-translator.ts";
import type { Glossary } from "./prompt.ts";
import type { Complete } from "./translator.ts";

const glossary: Glossary = { doNotTranslate: ["Rallly"], terms: [] };
const model = "test/model";

const source = `---
title: Plan with Rallly
date: 2026-01-02
category: guides
excerpt: How to plan.
---

## A heading

Visit [pricing](https://rallly.co/pricing) now.
`;

const sourceBody = matter(source).content;

type Call = {
  messages: { role: string; content: string }[];
  response_format: { json_schema: { strict: boolean } };
  service_tier: string;
};

type Response = Awaited<ReturnType<Complete>>;

const respond = ({
  content,
  finishReason = "stop",
}: {
  content: string | null;
  finishReason?: string | null;
}): Response => ({
  choices: [{ message: { content }, finish_reason: finishReason }],
});

const reply = (obj: unknown) => respond({ content: JSON.stringify(obj) });

const fake = (queue: Response[]) => {
  const calls: Call[] = [];
  const complete: Complete = async (params) => {
    calls.push(params as unknown as Call);
    const next = queue.shift();
    if (!next) throw new Error("fake complete: queue exhausted");
    return next;
  };
  return { complete, calls };
};

const userJson = (call: Call | undefined) =>
  JSON.parse(call?.messages[call.messages.length - 1]?.content ?? "{}");

const good = {
  title: "Planen mit Rallly",
  excerpt: "So planst du.",
  body: "## Eine Überschrift\n\nBesuche [Preise](https://rallly.co/pricing) jetzt.\n",
};

const run = (complete: Complete, extra: { previous?: string } = {}) =>
  translatePost({
    complete,
    model,
    locale: "de",
    glossary,
    source,
    ...extra,
  });

describe("translatePost", () => {
  it("sends flex tier, strict schema and the English parts", async () => {
    const { complete, calls } = fake([reply(good)]);
    await run(complete);
    expect(calls[0]?.service_tier).toBe("flex");
    expect(calls[0]?.response_format.json_schema.strict).toBe(true);
    expect(userJson(calls[0])).toEqual({
      title: "Plan with Rallly",
      excerpt: "How to plan.",
      body: sourceBody,
    });
  });

  it("translates a post without an excerpt", async () => {
    const noExcerpt = source.replace("excerpt: How to plan.\n", "");
    const { complete, calls } = fake([
      reply({ title: good.title, body: good.body }),
    ]);
    const result = await translatePost({
      complete,
      model,
      locale: "de",
      glossary,
      source: noExcerpt,
    });
    expect(userJson(calls[0])).toEqual({
      title: "Plan with Rallly",
      body: sourceBody,
    });
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(matter(result.content).data).not.toHaveProperty("excerpt");
  });

  it("assembles the translation under the English frontmatter", async () => {
    const { complete } = fake([reply(good)]);
    const result = await run(complete);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const file = matter(result.content);
    expect(file.data.title).toBe("Planen mit Rallly");
    expect(file.data.category).toBe("guides");
    expect(file.data.date).toEqual(matter(source).data.date);
    expect(file.content).toContain("Eine Überschrift");
  });

  it("passes a previous translation on the first request", async () => {
    const { complete, calls } = fake([reply(good)]);
    await run(complete, { previous: "old file" });
    expect(userJson(calls[0]).previous).toBe("old file");
    expect(userJson(calls[0]).error).toBeUndefined();
  });

  it("retries once with the rejection reasons", async () => {
    const { complete, calls } = fake([
      reply({
        ...good,
        body: "## Eine Überschrift\n\nBesuche Preise jetzt.\n",
      }),
      reply(good),
    ]);
    const result = await run(complete);
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(2);
    expect(userJson(calls[1]).error).toContain("https://rallly.co/pricing");
    expect(userJson(calls[1]).previous).toContain("Besuche Preise jetzt");
  });

  it("fails after a second invalid response", async () => {
    const bad = reply({ ...good, body: "nothing" });
    const { complete, calls } = fake([bad, bad]);
    const result = await run(complete);
    expect(result.ok).toBe(false);
    expect(calls).toHaveLength(2);
  });

  it("fails without retry when cut off", async () => {
    const { complete, calls } = fake([
      respond({ content: null, finishReason: "length" }),
    ]);
    const result = await run(complete);
    expect(result).toEqual({
      ok: false,
      reason: "response was cut off (finish_reason: length)",
    });
    expect(calls).toHaveLength(1);
  });

  it("rejects a translation missing a protected term", async () => {
    const bad = reply({ ...good, title: "Planen mit Termin" });
    const { complete, calls } = fake([bad, bad]);
    const result = await run(complete);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("Rallly");
    expect(calls).toHaveLength(2);
  });

  it("returns the message when complete throws", async () => {
    const complete: Complete = async () => {
      throw new Error("boom");
    };
    expect(await run(complete)).toEqual({ ok: false, reason: "boom" });
  });
});
