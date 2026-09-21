import "server-only";

import { Layer, ManagedRuntime } from "effect";

/**
 * The one runtime non-Effect code runs Effects through. Built from
 * infrastructure layers only; feature layers are provided at the call site
 * with `Effect.provide`, so `lib` never imports a feature. The memo map is
 * module level so layers memoize across any future runtimes in the process.
 */
const memoMap = Layer.makeMemoMapUnsafe();

export const runtime = ManagedRuntime.make(Layer.empty, { memoMap });
