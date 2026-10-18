import { afterEach, describe, expect, it } from "vitest";
import {
  chunkRegistrationLogScript,
  getChunkRegistrationContext,
} from "./chunk-registration-log";

const g = globalThis as Record<string, unknown>;

const script = (src: string) => ({ getAttribute: () => src });
const chunk = (src: string, ...ids: number[]) => [
  script(`https://static.rallly.co/_next/static/immutable/chunks/${src}`),
  ...ids,
  () => {},
];

// What every chunk does: `(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(...)`.
const pushChunk = (entry: unknown) => {
  if (!g.TURBOPACK) g.TURBOPACK = [];
  (g.TURBOPACK as { push: (e: unknown) => void }).push(entry);
};

// Runs the exact string the layout inlines.
const install = () => new Function(chunkRegistrationLogScript)();

// Stands in for the Turbopack runtime: replay the queue, then take over push.
function loadRuntime() {
  const received: unknown[] = [];
  const queued = g.TURBOPACK as unknown[];
  g.TURBOPACK = { push: (entry: unknown) => received.push(entry) };
  for (const entry of queued) received.push(entry);
  return received;
}

afterEach(() => {
  delete g.TURBOPACK;
  delete g.__chunkRegistrations;
  delete g.__chunkRegistrationsLate;
});

describe("installChunkRegistrationLog", () => {
  it("records chunks queued before it, pushed after it, and after the runtime loads", () => {
    g.TURBOPACK = [chunk("a.js", 1, 2)];
    install();
    pushChunk(chunk("b.js", 3));
    const received = loadRuntime();
    pushChunk(chunk("c.js", 4, 5));

    expect(received).toHaveLength(3);
    const context = getChunkRegistrationContext(
      "Module 4 was instantiated because it was required from module 3, but the module factory is not available.",
    );
    expect(context).toMatchObject({
      installedLate: false,
      missingModule: 4,
      missingModuleRegisteredBy: [{ file: "c.js" }],
      requiredFrom: 3,
      requiredFromRegisteredBy: [{ file: "b.js" }],
    });
    expect(context?.registrations.map((r) => [r.file, r.modules])).toEqual([
      ["a.js", 2],
      ["b.js", 1],
      ["c.js", 2],
    ]);
  });

  it("reports a missing module no chunk carried", () => {
    install();
    pushChunk(chunk("a.js", 1));
    expect(
      getChunkRegistrationContext(
        "Module 9 was instantiated because it was required from module 1, but the module factory is not available.",
      )?.missingModuleRegisteredBy,
    ).toEqual([]);
  });

  it("flags a log installed after the runtime replayed the queue", () => {
    g.TURBOPACK = { push: () => {} };
    install();
    pushChunk(chunk("a.js", 1));
    expect(getChunkRegistrationContext("")).toMatchObject({
      installedLate: true,
      registrations: [{ file: "a.js", modules: 1 }],
    });
  });

  it("records a null src when the chunk has no current script", () => {
    install();
    pushChunk([undefined, 1, () => {}]);
    expect(getChunkRegistrationContext("")?.registrations[0]?.file).toBe(null);
  });
});

describe("getChunkRegistrationContext", () => {
  it("returns nothing when the log was never installed", () => {
    expect(getChunkRegistrationContext("")).toBeUndefined();
  });
});
