import { inferAsyncReturnType } from "@trpc/server";
import * as trpc from "@trpc/server";

import { createContext } from "./context";

type Context = inferAsyncReturnType<typeof createContext>;

// Helper function to create a router with your app's context
export function createRouter() {
  return trpc.router<Context>();
}
