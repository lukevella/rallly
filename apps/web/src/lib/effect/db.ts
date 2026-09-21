import { Data, Effect } from "effect";

/**
 * A Prisma call that rejected. The cause is the driver's error, kept as a
 * defect: callers do not branch on it, they let it reach the boundary where
 * an uncaught throw would have gone before.
 */
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  cause: unknown;
}> {}

/**
 * Lifts a Promise based `data.ts` read or a raw Prisma call into an Effect.
 * Takes a thunk so this module never imports `@rallly/database`; a Prisma
 * `Context.Service` replaces it when `data.ts` migrates.
 */
export function fromPrisma<A>(thunk: () => PromiseLike<A>) {
  return Effect.tryPromise({
    try: thunk,
    catch: (cause) => new DatabaseError({ cause }),
  });
}
