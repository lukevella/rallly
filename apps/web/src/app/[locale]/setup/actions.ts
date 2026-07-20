"use server";

import * as z from "zod";
import { adoptOrphanedPolls } from "@/features/poll/mutations";
import { getOwnedSpace } from "@/features/space/data";
import { createSpace } from "@/features/space/mutations";
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
 * Creates the user's space at the end of onboarding — registration doesn't
 * create one, so this is where every account gets theirs. Accounts that
 * already own a space (pre-existing accounts sent through setup to backfill
 * profile fields, or a re-submit) only retry poll adoption: setup never
 * renames or duplicates an existing space.
 */
export const setupSpaceAction = authActionClient
  .metadata({ actionName: "setup_space" })
  .inputSchema(setupSpaceSchema)
  .action(async ({ ctx, parsedInput }) => {
    const ownedSpace = await getOwnedSpace(ctx.user.id);

    if (ownedSpace) {
      // Create and adopt aren't atomic: a previous submit may have created
      // the space and failed before adoption, so retries still pull
      // orphaned polls in (a no-op when there are none).
      await adoptOrphanedPolls({
        userId: ctx.user.id,
        spaceId: ownedSpace.id,
      });
      return;
    }

    const name =
      parsedInput.spaceType === "work"
        ? parsedInput.organizationName
        : "Personal";

    const space = await createSpace({
      name,
      ownerId: ctx.user.id,
    });

    // Guest linking migrates polls without a space; pull them into the one
    // just created.
    await adoptOrphanedPolls({
      userId: ctx.user.id,
      spaceId: space.id,
    });

    identifyGroup({
      distinctId: ctx.user.id,
      groupType: "space",
      groupKey: space.id,
      properties: {
        type: parsedInput.spaceType,
        name,
        tier: space.tier,
        member_count: 1,
        seat_count: 1,
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
        space: space.id,
      },
    });
  });
