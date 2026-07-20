"use server";

import { subject } from "@casl/ability";
import * as z from "zod";
import { adoptOrphanedPolls } from "@/features/poll/mutations";
import { getActiveSpaceForUser } from "@/features/space/data";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { createSpace, updateSpace } from "@/features/space/mutations";
import { identifyGroup, track } from "@/lib/posthog";
import { authActionClient } from "@/lib/safe-action/server";

const setupSpaceSchema = z.discriminatedUnion("spaceType", [
  z.object({ spaceType: z.literal("personal") }),
  z.object({
    spaceType: z.literal("work"),
    organizationName: z.string().min(1).max(100),
  }),
]);

/**
 * Names the user's space during onboarding: renames the active space when
 * they're allowed to (every new account owns an auto-created "Personal"
 * space), or creates one when they have none. A member of someone else's
 * space who owns no space of their own gets nothing renamed or relabeled.
 */
export const setupSpaceAction = authActionClient
  .metadata({ actionName: "setup_space" })
  .inputSchema(setupSpaceSchema)
  .action(async ({ ctx, parsedInput }) => {
    const name =
      parsedInput.spaceType === "work"
        ? parsedInput.organizationName
        : "Personal";

    const existingSpace = await getActiveSpaceForUser(ctx.user.id);

    let spaceId: string | null = null;

    if (!existingSpace) {
      const space = await createSpace({
        name,
        ownerId: ctx.user.id,
      });
      // Guest linking into an account without a space migrates polls with
      // no space; pull them into the one just created.
      await adoptOrphanedPolls({
        userId: ctx.user.id,
        spaceId: space.id,
      });
      spaceId = space.id;
    } else {
      const ability = defineAbilityForMember({
        user: ctx.user,
        space: existingSpace,
      });

      if (ability.can("update", subject("Space", existingSpace))) {
        await updateSpace({
          spaceId: existingSpace.id,
          name,
        });
        spaceId = existingSpace.id;
      }
    }

    if (spaceId) {
      identifyGroup({
        groupType: "space",
        groupKey: spaceId,
        properties: {
          type: parsedInput.spaceType,
        },
      });

      track(ctx.user, {
        event: "space_setup",
        properties: {
          space_type: parsedInput.spaceType,
          // The register event $sets these from the user row at creation
          // time, which for OTP signups is an empty name and no timezone.
          // The form updates both right before this action runs, so patch
          // the person profile here.
          $set: {
            name: ctx.user.name,
            timeZone: ctx.user.timeZone ?? undefined,
          },
        },
        groups: {
          space: spaceId,
        },
      });
    }
  });
