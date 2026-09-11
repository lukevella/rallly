"use server";

import { refresh } from "next/cache";

import { authActionClient } from "@/lib/safe-action/server";
import { disconnectConferencingConnection } from "./mutations";
import { disconnectConferencingConnectionSchema } from "./schema";

export const disconnectConferencingConnectionAction = authActionClient
  .metadata({ actionName: "disconnect_conferencing_connection" })
  .inputSchema(disconnectConferencingConnectionSchema)
  .action(async ({ ctx, parsedInput }) => {
    await disconnectConferencingConnection({
      userId: ctx.user.id,
      id: parsedInput.id,
    });

    refresh();
  });
