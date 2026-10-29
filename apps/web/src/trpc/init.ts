import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { AppError } from "@/lib/errors/app-error";
import type { TRPCContext } from "./context";

export const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        appError:
          error.cause instanceof AppError ? error.cause.code : undefined,
      },
    };
  },
});
