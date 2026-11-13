import { describe, expect, it } from "vitest";
import type { Glossary } from "./prompt.ts";
import type { Complete } from "./translator.ts";
import { defaultModel, translateItems } from "./translator.ts";

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
  provider: object;
};

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
    calls.push(params as Call);
    const next = queue.shift();
    if (!next) throw new Error("fake complete: queue exhausted");
    return next;
  };
  return { complete, calls };
};

const run = (
  complete: Complete,
  items: { key: string; source: string }[],
  extra: { provider?: string } = {},
) =>
  translateItems({
    complete,
    model,
    locale: "de",
    glossary,
    reference: {},
    items,
    ...extra,
  });

const save = [{ key: "a", source: "Save" }];

describe("translateItems", () => {
  it("exposes the default model", () => {
    expect(defaultModel).toBe("qwen/qwen3.8-27b");
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

  it("requires parameters without pinning a provider by default", async () => {
    const { complete, calls } = fake([
      reply({ translations: [{ key: "a", value: "Speichern" }] }),
    ]);
    await run(complete, save);
    expect(calls[0]?.provider).toEqual({ require_parameters: true });
  });

  it("sends require_parameters and pins a provider when asked", async () => {
    const { complete, calls } = fake([
      reply({ translations: [{ key: "a", value: "Speichern" }] }),
    ]);
    await run(complete, save, { provider: "fireworks" });
    expect(calls[0]?.provider).toEqual({
      require_parameters: true,
      only: ["fireworks"],
    });
    expect(calls[0]?.response_format.json_schema.strict).toBe(true);
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

  it("fails the chunk on a truncated response without retrying", async () => {
    const truncated = respond({
      content: '{"translations":[',
      finishReason: "length",
    });
    const { complete, calls } = fake([truncated]);
    const r = await run(complete, save);
    expect(calls).toHaveLength(1);
    expect(r.translated).toEqual({});
    expect(r.failed[0]?.key).toBe("a");
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
  });

  it("propagates a thrown API error", async () => {
    const complete: Complete = async () => {
      throw new Error("402 payment required");
    };
    await expect(run(complete, save)).rejects.toThrow("402");
  });

  it("splits 250 items into three requests", async () => {
    const items = Array.from({ length: 250 }, (_, i) => ({
      key: `k${i}`,
      source: `Source ${i}`,
    }));
    const calls: Call[] = [];
    const complete: Complete = async (params) => {
      calls.push(params as Call);
      const sent = JSON.parse(lastContent(params as Call));
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
