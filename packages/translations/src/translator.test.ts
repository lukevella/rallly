import { describe, expect, it } from "vitest";
import type { Glossary } from "./prompt.ts";
import type { Complete } from "./translator.ts";
import { defaultModel, serviceTier, translateItems } from "./translator.ts";

const glossary: Glossary = { doNotTranslate: ["Rallly"], terms: [] };
const model = "test/model";

type Response = Awaited<ReturnType<Complete>>;

type Call = {
  model: string;
  messages: { role: string; content: string }[];
  response_format: {
    json_schema: {
      name: string;
      strict: boolean;
      schema: {
        additionalProperties: boolean;
        properties: {
          translations: {
            items: { required: string[]; additionalProperties: boolean };
          };
        };
      };
    };
  };
  service_tier: string;
};

const asCall = (params: Parameters<Complete>[0]) => params as unknown as Call;

const lastMessage = (call: Call | undefined) =>
  call?.messages[call.messages.length - 1];

const lastContent = (call: Call | undefined) =>
  lastMessage(call)?.content ?? "";

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
    calls.push(asCall(params));
    const next = queue.shift();
    if (!next) throw new Error("fake complete: queue exhausted");
    return next;
  };
  return { complete, calls };
};

const run = (complete: Complete, items: { key: string; source: string }[]) =>
  translateItems({
    complete,
    model,
    locale: "de",
    glossary,
    reference: {},
    items,
  });

const save = [{ key: "a", source: "Save" }];

describe("translateItems", () => {
  it("exposes the default model", () => {
    expect(defaultModel).toBe("gpt-5.6-luna");
  });

  it("returns validated translations", async () => {
    const { complete } = fake([
      reply({ translations: [{ key: "a", value: "Speichern" }] }),
    ]);
    expect(await run(complete, save)).toEqual({
      translated: { a: "Speichern" },
      failed: [],
    });
  });

  it("sends the model, schema and messages", async () => {
    const { complete, calls } = fake([
      reply({ translations: [{ key: "a", value: "Speichern" }] }),
    ]);
    await run(complete, save);
    expect(calls[0]?.model).toBe(model);
    expect(calls[0]?.messages[0]?.role).toBe("system");
    expect(lastMessage(calls[0])).toEqual({
      role: "user",
      content: JSON.stringify([{ key: "a", source: "Save" }]),
    });
    const jsonSchema = calls[0]?.response_format.json_schema;
    expect(jsonSchema?.name).toBe("translations");
    expect(jsonSchema?.schema.additionalProperties).toBe(false);
    const item = jsonSchema?.schema.properties.translations.items;
    expect(item?.required).toEqual(["key", "value"]);
    expect(item?.additionalProperties).toBe(false);
  });

  it("sends strict json_schema on the flex tier with no provider field", async () => {
    const { complete, calls } = fake([
      reply({ translations: [{ key: "a", value: "Speichern" }] }),
    ]);
    await run(complete, save);
    expect(calls[0]?.service_tier).toBe(serviceTier);
    expect(serviceTier).toBe("flex");
    expect(calls[0]?.response_format.json_schema.strict).toBe(true);
    expect(calls[0]).not.toHaveProperty("provider");
  });

  it("ignores keys that were not requested", async () => {
    const { complete } = fake([
      reply({
        translations: [
          { key: "a", value: "Speichern" },
          { key: "zzz", value: "x" },
        ],
      }),
    ]);
    const r = await run(complete, save);
    expect(r.translated).toEqual({ a: "Speichern" });
    expect(r.failed).toEqual([]);
  });

  it("retries an invalid value once with the error fed back", async () => {
    const { complete, calls } = fake([
      reply({ translations: [{ key: "b", value: "Hallo {nom}" }] }),
      reply({ translations: [{ key: "b", value: "Hallo {name}" }] }),
    ]);
    const r = await run(complete, [{ key: "b", source: "Hi {name}" }]);
    expect(r).toEqual({ translated: { b: "Hallo {name}" }, failed: [] });
    expect(calls).toHaveLength(2);
    const sent = JSON.parse(lastContent(calls[1]));
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ key: "b", previous: "Hallo {nom}" });
    expect(typeof sent[0].error).toBe("string");
    expect(sent[0].error.length).toBeGreaterThan(0);
  });

  it("fails a key that is still invalid after the retry, with the reason", async () => {
    const bad = reply({ translations: [{ key: "b", value: "Hallo {nom}" }] });
    const { complete, calls } = fake([bad, bad]);
    const r = await run(complete, [{ key: "b", source: "Hi {name}" }]);
    expect(calls).toHaveLength(2);
    expect(r.translated).toEqual({});
    expect(r.failed).toHaveLength(1);
    expect(r.failed[0]?.key).toBe("b");
    expect(r.failed[0]?.reason).not.toBe("missing from response");
    expect(r.failed[0]?.reason.length).toBeGreaterThan(0);
  });

  it("retries only the keys that failed", async () => {
    const { complete, calls } = fake([
      reply({
        translations: [
          { key: "a", value: "Speichern" },
          { key: "b", value: "Hallo {nom}" },
        ],
      }),
      reply({ translations: [{ key: "b", value: "Hallo {name}" }] }),
    ]);
    const r = await run(complete, [
      { key: "a", source: "Save" },
      { key: "b", source: "Hi {name}" },
    ]);
    expect(r.translated).toEqual({ a: "Speichern", b: "Hallo {name}" });
    expect(r.failed).toEqual([]);
    const sent = JSON.parse(lastContent(calls[1]));
    expect(sent.map((i: { key: string }) => i.key)).toEqual(["b"]);
  });

  const runWith = ({
    complete,
    locale,
    items,
  }: {
    complete: Complete;
    locale: string;
    items: { key: string; source: string }[];
  }) =>
    translateItems({
      complete,
      model,
      locale,
      glossary: { doNotTranslate: ["Rallly", "Pro"], terms: [] },
      reference: {},
      items,
    });

  it("retries a translation that translates a protected term", async () => {
    const { complete, calls } = fake([
      reply({ translations: [{ key: "u", value: "Auf Premium upgraden" }] }),
      reply({ translations: [{ key: "u", value: "Auf Pro upgraden" }] }),
    ]);
    const r = await runWith({
      complete,
      locale: "de",
      items: [{ key: "u", source: "Upgrade to Pro" }],
    });
    expect(r).toEqual({ translated: { u: "Auf Pro upgraden" }, failed: [] });
    expect(calls).toHaveLength(2);
    const sent = JSON.parse(lastContent(calls[1]));
    expect(sent[0]).toMatchObject({
      key: "u",
      previous: "Auf Premium upgraden",
    });
    expect(sent[0].error).toContain('"Pro"');
  });

  it("fails a protected term that is translated twice", async () => {
    const bad = reply({
      translations: [{ key: "u", value: "Auf Premium upgraden" }],
    });
    const { complete } = fake([bad, bad]);
    const r = await runWith({
      complete,
      locale: "de",
      items: [{ key: "u", source: "Upgrade to Pro" }],
    });
    expect(r.translated).toEqual({});
    expect(r.failed[0]?.reason).toContain('"Pro"');
  });

  it("finds a protected term without surrounding spaces", async () => {
    const { complete, calls } = fake([
      reply({ translations: [{ key: "u", value: "升级到Pro" }] }),
    ]);
    const r = await runWith({
      complete,
      locale: "zh",
      items: [{ key: "u", source: "Upgrade to Pro" }],
    });
    expect(r).toEqual({ translated: { u: "升级到Pro" }, failed: [] });
    expect(calls).toHaveLength(1);
  });

  it("only protects a term the source uses as a whole word", async () => {
    const { complete } = fake([
      reply({ translations: [{ key: "p", value: "Angeben" }] }),
    ]);
    const r = await runWith({
      complete,
      locale: "de",
      items: [{ key: "p", source: "Provide" }],
    });
    expect(r.translated).toEqual({ p: "Angeben" });
  });

  it("fails a key that is omitted twice", async () => {
    const { complete, calls } = fake([
      reply({ translations: [] }),
      reply({ translations: [] }),
    ]);
    const r = await run(complete, save);
    expect(calls).toHaveLength(2);
    expect(r).toEqual({
      translated: {},
      failed: [{ key: "a", reason: "missing from response" }],
    });
    const sent = JSON.parse(lastContent(calls[1]));
    expect(sent[0]).toMatchObject({ key: "a", error: "missing from response" });
  });

  it("retries unparseable content once, then fails the chunk", async () => {
    const bad = respond({ content: "Sure! Here you go:" });
    const { complete, calls } = fake([bad, bad]);
    const r = await run(complete, save);
    expect(calls).toHaveLength(2);
    expect(r.translated).toEqual({});
    expect(r.failed).toHaveLength(1);
    expect(r.failed[0]?.key).toBe("a");
    expect(r.failed[0]?.reason).toMatch(/JSON/i);
  });

  it("recovers when the retry after unparseable content succeeds", async () => {
    const { complete } = fake([
      respond({ content: "Sure!" }),
      reply({ translations: [{ key: "a", value: "Speichern" }] }),
    ]);
    expect(await run(complete, save)).toEqual({
      translated: { a: "Speichern" },
      failed: [],
    });
  });

  it("fails JSON that does not match the schema", async () => {
    const wrong = reply({ translated: [{ key: "a", value: "Speichern" }] });
    const { complete, calls } = fake([wrong, wrong]);
    const r = await run(complete, save);
    expect(calls).toHaveLength(2);
    expect(r.translated).toEqual({});
    expect(r.failed[0]?.key).toBe("a");
    expect(r.failed[0]?.reason).toMatch(/schema/i);
  });

  it("recovers a fenced JSON response", async () => {
    const fenced = respond({
      content:
        '```json\n{"translations":[{"key":"a","value":"Speichern"}]}\n```',
    });
    const { complete, calls } = fake([fenced]);
    const r = await run(complete, save);
    expect(r.translated).toEqual({ a: "Speichern" });
    expect(calls).toHaveLength(1);
  });

  const truncated = respond({
    content: '{"translations":[',
    finishReason: "length",
  });
  const four = ["a", "b", "c", "d"].map((key) => ({ key, source: key }));
  const ok = (keys: string[]) =>
    reply({ translations: keys.map((key) => ({ key, value: key })) });
  const keysOf = (call: Call | undefined) =>
    JSON.parse(lastContent(call)).map((i: { key: string }) => i.key);

  it("splits a truncated chunk into two halves", async () => {
    const { complete, calls } = fake([
      truncated,
      ok(["a", "b"]),
      ok(["c", "d"]),
    ]);
    const r = await run(complete, four);
    expect(calls).toHaveLength(3);
    expect(keysOf(calls[1])).toEqual(["a", "b"]);
    expect(keysOf(calls[2])).toEqual(["c", "d"]);
    expect(r.translated).toEqual({ a: "a", b: "b", c: "c", d: "d" });
    expect(r.failed).toEqual([]);
  });

  it("fails only the half that truncates again, without splitting further", async () => {
    const { complete, calls } = fake([truncated, ok(["a", "b"]), truncated]);
    const r = await run(complete, four);
    expect(calls).toHaveLength(3);
    expect(r.translated).toEqual({ a: "a", b: "b" });
    expect(r.failed.map((f) => f.key)).toEqual(["c", "d"]);
    for (const f of r.failed) expect(f.reason).toMatch(/length/);
  });

  it("gives each half its own single validation retry", async () => {
    const { complete, calls } = fake([
      truncated,
      reply({ translations: [{ key: "a", value: "a" }] }),
      ok(["b"]),
      ok(["c", "d"]),
    ]);
    const r = await run(complete, four);
    expect(calls).toHaveLength(4);
    expect(keysOf(calls[2])).toEqual(["b"]);
    expect(r.failed).toEqual([]);
    expect(Object.keys(r.translated)).toHaveLength(4);
  });

  it("bounds the requests for a chunk that always truncates", async () => {
    const { complete, calls } = fake(Array(20).fill(truncated));
    const r = await run(complete, four);
    expect(calls).toHaveLength(3);
    expect(r.translated).toEqual({});
    expect(r.failed).toHaveLength(4);
  });

  it("does not split a single truncating item", async () => {
    const { complete, calls } = fake([truncated, truncated]);
    const r = await run(complete, save);
    expect(calls).toHaveLength(1);
    expect(r.failed[0]?.reason).toMatch(/length/);
  });

  it("tolerates null content", async () => {
    const empty = respond({ content: null });
    const { complete, calls } = fake([empty, empty]);
    const r = await run(complete, save);
    expect(calls).toHaveLength(2);
    expect(r.translated).toEqual({});
    expect(r.failed).toHaveLength(1);
    expect(r.failed[0]?.reason).toMatch(/empty/i);
  });

  it("tolerates an empty choices array", async () => {
    const none: Response = { choices: [] };
    const { complete, calls } = fake([none, none]);
    const r = await run(complete, save);
    expect(calls).toHaveLength(2);
    expect(r.failed).toHaveLength(1);
    expect(r.failed[0]?.reason).toMatch(/choices/i);
  });

  it("fails the chunk's keys with the message of a thrown API error", async () => {
    const complete: Complete = async () => {
      throw new Error("402 payment required");
    };
    expect(await run(complete, save)).toEqual({
      translated: {},
      failed: [{ key: "a", reason: "402 payment required" }],
    });
  });

  it("keeps earlier chunks when a later chunk throws", async () => {
    const items = Array.from({ length: 450 }, (_, i) => ({
      key: `k${i}`,
      source: `Source ${i}`,
    }));
    let count = 0;
    const complete: Complete = async (params) => {
      count++;
      if (count === 3) throw new Error("429 flex capacity");
      const sent = JSON.parse(lastContent(asCall(params)));
      return reply({
        translations: sent.map((i: { key: string; source: string }) => ({
          key: i.key,
          value: i.source,
        })),
      });
    };
    const r = await run(complete, items);
    expect(count).toBe(5);
    expect(Object.keys(r.translated)).toHaveLength(350);
    expect(r.translated.k199).toBe("Source 199");
    expect(r.translated.k300).toBe("Source 300");
    expect(r.failed).toHaveLength(100);
    expect(r.failed[0]).toEqual({ key: "k200", reason: "429 flex capacity" });
    expect(r.failed[99]?.key).toBe("k299");
  });

  it("keeps the first pass's accepted keys when the retry throws", async () => {
    let count = 0;
    const complete: Complete = async () => {
      count++;
      if (count === 2) throw new Error("timed out");
      return reply({
        translations: [
          { key: "a", value: "Speichern" },
          { key: "b", value: "Hallo {nom}" },
        ],
      });
    };
    const r = await run(complete, [
      { key: "a", source: "Save" },
      { key: "b", source: "Hi {name}" },
    ]);
    expect(count).toBe(2);
    expect(r).toEqual({
      translated: { a: "Speichern" },
      failed: [{ key: "b", reason: "timed out" }],
    });
  });

  it("keeps the first half of a split chunk when the second half throws", async () => {
    const { complete } = fake([truncated, ok(["a", "b"])]);
    const r = await run(complete, four);
    expect(r.translated).toEqual({ a: "a", b: "b" });
    expect(r.failed).toEqual([
      { key: "c", reason: "fake complete: queue exhausted" },
      { key: "d", reason: "fake complete: queue exhausted" },
    ]);
  });

  it("splits 250 items into three requests", async () => {
    const items = Array.from({ length: 250 }, (_, i) => ({
      key: `k${i}`,
      source: `Source ${i}`,
    }));
    const calls: Call[] = [];
    const complete: Complete = async (params) => {
      calls.push(asCall(params));
      const sent = JSON.parse(lastContent(asCall(params)));
      return reply({
        translations: sent.map((i: { key: string; source: string }) => ({
          key: i.key,
          value: i.source,
        })),
      });
    };
    const r = await run(complete, items);
    expect(calls).toHaveLength(3);
    expect(calls.map((c) => JSON.parse(lastContent(c)).length)).toEqual([
      100, 100, 50,
    ]);
    expect(Object.keys(r.translated)).toHaveLength(250);
    expect(r.failed).toEqual([]);
  });
});
