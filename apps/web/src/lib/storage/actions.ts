"use server";

import { z } from "zod";
import { AppError } from "@/lib/errors";
import { authActionClient } from "@/lib/safe-action/server";
import { isStorageEnabled } from "@/lib/storage/constants";
import { getImageUploadUrl } from "./image-upload";

export const getImageUploadUrlAction = authActionClient
  .metadata({
    actionName: "get_image_upload_url",
  })
  .inputSchema(
    z.object({
      keyPrefix: z.enum(["avatars", "spaces"]),
      fileType: z.enum(["image/jpeg", "image/png"]),
      fileSize: z.number(),
    }),
  )
  .use(async ({ next }) => {
    if (!isStorageEnabled) {
      throw new AppError({
        code: "SERVICE_UNAVAILABLE",
        message:
          "This feature requires an object store to be configured on this instance.",
      });
    }
    return next();
  })
  .action(async ({ ctx, parsedInput }) => {
    return await getImageUploadUrl({
      keyPrefix: parsedInput.keyPrefix,
      entityId: ctx.user.id,
      fileType: parsedInput.fileType,
      fileSize: parsedInput.fileSize,
    });
  });
