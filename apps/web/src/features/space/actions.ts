"use server";

import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import * as z from "zod";
import { getActiveSpaceForUser } from "@/features/space/data";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { effectiveSpaceMemberWhere } from "@/features/space/member/utils";
import {
  removeSpaceImage,
  updateSpace,
  updateSpaceImage,
  updateSpaceShowBranding,
} from "@/features/space/mutations";
import {
  spaceImageUploadSchema,
  updateSpaceImageSchema,
  updateSpaceSchema,
  updateSpaceShowBrandingSchema,
} from "@/features/space/schema";
import { setActiveSpace } from "@/features/user/mutations";
import { AppError } from "@/lib/errors/app-error";
import { identifyGroup, track } from "@/lib/posthog";
import { authActionClient } from "@/lib/safe-action/server";
import { getImageUploadUrl } from "@/lib/storage/image-upload";

async function requireSpaceWithUpdateAbility(user: { id: string }) {
  const space = await getActiveSpaceForUser(user.id);

  if (!space) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "No active space found",
    });
  }

  const ability = defineAbilityForMember({ user, space });

  if (ability.cannot("update", subject("Space", space))) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "You do not have permission to update this space",
    });
  }

  return space;
}

export const setActiveSpaceAction = authActionClient
  .metadata({ actionName: "set_active_space" })
  .inputSchema(z.object({ spaceId: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    const member = await prisma.spaceMember.findFirst({
      where: {
        spaceId: parsedInput.spaceId,
        ...effectiveSpaceMemberWhere({ userId: ctx.user.id }),
      },
    });

    if (!member) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Space not found",
      });
    }

    await setActiveSpace({
      userId: ctx.user.id,
      spaceId: parsedInput.spaceId,
    });

    track(ctx.user, {
      event: "space_set_active",
      properties: {
        space_id: parsedInput.spaceId,
      },
      groups: {
        space: parsedInput.spaceId,
      },
    });
  });

export const updateSpaceAction = authActionClient
  .metadata({ actionName: "update_space" })
  .inputSchema(updateSpaceSchema)
  .action(async ({ ctx, parsedInput }) => {
    const space = await requireSpaceWithUpdateAbility(ctx.user);

    await updateSpace({
      spaceId: space.id,
      name: parsedInput.name,
      primaryColor: parsedInput.primaryColor,
    });

    track(ctx.user, {
      event: "space_update",
      properties: {
        space_name: parsedInput.name,
      },
      groups: {
        space: space.id,
      },
    });
  });

export const updateSpaceShowBrandingAction = authActionClient
  .metadata({ actionName: "update_space_show_branding" })
  .inputSchema(updateSpaceShowBrandingSchema)
  .action(async ({ ctx, parsedInput }) => {
    const space = await requireSpaceWithUpdateAbility(ctx.user);

    if (parsedInput.showBranding && space.tier !== "pro") {
      throw new AppError({
        code: "PAYMENT_REQUIRED",
        message: "You need a Pro subscription to enable custom branding",
      });
    }

    await updateSpaceShowBranding({
      spaceId: space.id,
      showBranding: parsedInput.showBranding,
    });

    identifyGroup({
      groupType: "space",
      groupKey: space.id,
      properties: {
        custom_branding: parsedInput.showBranding,
      },
    });

    track(ctx.user, {
      event: "space_update_show_branding",
      properties: {
        showBranding: parsedInput.showBranding,
      },
      groups: {
        space: space.id,
      },
    });
  });

export const getSpaceImageUploadUrlAction = authActionClient
  .metadata({ actionName: "get_space_image_upload_url" })
  .inputSchema(spaceImageUploadSchema)
  .action(async ({ ctx, parsedInput }) => {
    const space = await requireSpaceWithUpdateAbility(ctx.user);

    return await getImageUploadUrl({
      keyPrefix: "spaces",
      entityId: space.id,
      fileType: parsedInput.fileType,
      fileSize: parsedInput.fileSize,
    });
  });

export const updateSpaceImageAction = authActionClient
  .metadata({ actionName: "update_space_image" })
  .inputSchema(updateSpaceImageSchema)
  .action(async ({ ctx, parsedInput }) => {
    const space = await requireSpaceWithUpdateAbility(ctx.user);

    if (!parsedInput.imageKey.startsWith(`spaces/${space.id}-`)) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Invalid image key",
      });
    }

    await updateSpaceImage({
      spaceId: space.id,
      imageKey: parsedInput.imageKey,
    });
  });

export const removeSpaceImageAction = authActionClient
  .metadata({ actionName: "remove_space_image" })
  .action(async ({ ctx }) => {
    const space = await requireSpaceWithUpdateAbility(ctx.user);

    await removeSpaceImage({ spaceId: space.id });
  });
