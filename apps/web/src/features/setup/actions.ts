"use server";

import { subject } from "@casl/ability";
import * as z from "zod";
import { getActiveSpaceForUser } from "@/features/space/data";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { createSpace, updateSpace } from "@/features/space/mutations";
import { authActionClient } from "@/lib/safe-action/server";

/**
 * Names the user's space during onboarding: renames the active space when
 * they're allowed to (every new account owns an auto-created "Personal"
 * space), or creates one when they have none. A member of someone else's
 * space who owns no space of their own gets nothing renamed.
 */
export const setupSpaceAction = authActionClient
  .metadata({ actionName: "setup_space" })
  .inputSchema(z.object({ spaceName: z.string().min(1).max(100) }))
  .action(async ({ ctx, parsedInput }) => {
    const space = await getActiveSpaceForUser(ctx.user.id);

    if (!space) {
      await createSpace({
        name: parsedInput.spaceName,
        ownerId: ctx.user.id,
      });
      return;
    }

    const ability = defineAbilityForMember({ user: ctx.user, space });

    if (ability.can("update", subject("Space", space))) {
      await updateSpace({
        spaceId: space.id,
        name: parsedInput.spaceName,
      });
    }
  });
