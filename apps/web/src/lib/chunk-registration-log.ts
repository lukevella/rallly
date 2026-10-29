// Records every chunk Turbopack registers so a module factory error can say
// whether the chunk holding the missing module ever ran, and under which
// script src. Chunks hand their modules to `globalThis.TURBOPACK.push`: an
// array until the runtime loads, then the runtime's own object, which this
// wraps when the runtime assigns it.

type ChunkRegistration = { src: string | null; ids: number[]; at: number };

type ChunkRegistrationGlobal = {
  TURBOPACK?: { push: (...entries: unknown[]) => unknown };
  __chunkRegistrations?: ChunkRegistration[];
  __chunkRegistrationsLate?: boolean;
};

// Serialized into an inline <head> script, so it must stay self contained: no
// imports and no references to anything else in this module.
export function installChunkRegistrationLog() {
  try {
    const g = globalThis as unknown as ChunkRegistrationGlobal;
    if (g.__chunkRegistrations) return;
    const log: ChunkRegistration[] = [];
    g.__chunkRegistrations = log;

    const record = (entry: unknown) => {
      // The runtime chunk pushes [script, params]; other pushes are
      // [script, ...moduleIds and factories].
      if (!Array.isArray(entry)) return;
      const script = entry[0] as { getAttribute?: (name: string) => string };
      const ids: number[] = [];
      for (let i = 1; i < entry.length; i++) {
        if (typeof entry[i] === "number") ids.push(entry[i]);
      }
      log.push({
        src:
          typeof script === "string"
            ? script
            : typeof script?.getAttribute === "function"
              ? script.getAttribute("src")
              : null,
        ids,
        at: Math.round(performance.now()),
      });
    };

    const wrap = (
      target: NonNullable<ChunkRegistrationGlobal["TURBOPACK"]>,
    ) => {
      const push = target.push;
      target.push = function (this: unknown, ...entries: unknown[]) {
        // Logging must never stop a chunk from registering.
        try {
          for (const entry of entries) record(entry);
        } catch {}
        return push.apply(this, entries);
      };
    };

    let current = g.TURBOPACK;
    if (Array.isArray(current)) {
      // Chunks that ran before this script are still queued for the runtime.
      for (const entry of current) record(entry);
      wrap(current);
    } else if (current) {
      // The runtime already replayed the queue, so earlier chunks are lost.
      g.__chunkRegistrationsLate = true;
      wrap(current);
    }

    Object.defineProperty(g, "TURBOPACK", {
      configurable: true,
      enumerable: true,
      get: () => current,
      // The first chunk creates the queue array; the runtime replaces it.
      set: (value: ChunkRegistrationGlobal["TURBOPACK"]) => {
        if (value) wrap(value);
        current = value;
      },
    });
  } catch {
    // Diagnostics only; never break page boot.
  }
}

export const chunkRegistrationLogScript = `(${installChunkRegistrationLog.toString()})()`;

function fileName(src: string | null) {
  return src === null ? null : src.slice(src.lastIndexOf("/") + 1);
}

export function getChunkRegistrationContext(message: string) {
  const g = globalThis as unknown as ChunkRegistrationGlobal;
  const log = g.__chunkRegistrations;
  if (!Array.isArray(log)) return undefined;

  const match = message.match(
    /Module (\d+) was instantiated (?:because it was required from module (\d+))?/,
  );
  const missingModule = match ? Number(match[1]) : undefined;
  const requiredFrom = match?.[2] ? Number(match[2]) : undefined;
  const registeredBy = (id: number | undefined) =>
    id === undefined
      ? []
      : log
          .filter((entry) => entry.ids.includes(id))
          .map((entry) => ({ file: fileName(entry.src), at: entry.at }));

  return {
    installedLate: g.__chunkRegistrationsLate === true,
    at: Math.round(performance.now()),
    missingModule,
    // Empty means no chunk carrying the module ran before the error.
    missingModuleRegisteredBy: registeredBy(missingModule),
    requiredFrom,
    requiredFromRegisteredBy: registeredBy(requiredFrom),
    registrations: log.map((entry) => ({
      file: fileName(entry.src),
      modules: entry.ids.length,
      at: entry.at,
    })),
  };
}
