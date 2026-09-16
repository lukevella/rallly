"use client";

import { toast } from "@rallly/ui/sonner";
import React from "react";
import { useTranslation } from "@/i18n/client";
import { uploadAsset } from "@/lib/storage/upload-client";

/**
 * A safe-action result, structurally. Actions resolve (rather than reject)
 * on server errors, so success has to be read off the result — forgetting
 * that check is the bug class this hook exists to remove.
 */
interface ActionResult<T> {
  data?: T;
  serverError?: unknown;
  validationErrors?: unknown;
}

/**
 * Server errors already surface a toast via useSafeAction's global handler;
 * this marker keeps the hook from toasting the same failure twice.
 */
class ActionFailedError extends Error {}

function assertActionOk(result: ActionResult<unknown> | undefined) {
  if (result?.serverError) {
    throw new ActionFailedError("Action failed");
  }
  if (!result || result.validationErrors) {
    throw new Error("Action failed");
  }
}

/**
 * The two-phase upload protocol, once: sign against the slot's profile,
 * PUT the bytes, persist the key. Any failed step aborts the pipeline and
 * reports the error — success is only signalled after the persist action
 * confirmed the key was stored.
 *
 * Files must already be validated against the profile (the upload control
 * does this before cropping).
 */
export function useAssetUpload<TAccept extends string>({
  signUpload,
  persistUpload,
}: {
  signUpload: (input: {
    fileType: TAccept;
    fileSize: number;
  }) => Promise<ActionResult<{ url: string; key: string }> | undefined>;
  persistUpload: (key: string) => Promise<ActionResult<unknown> | undefined>;
}) {
  const { t } = useTranslation();
  const [isUploading, startUploading] = React.useTransition();

  const upload = (file: File, options?: { onSuccess?: () => void }) => {
    startUploading(async () => {
      try {
        const signResult = await signUpload({
          fileType: file.type as TAccept,
          fileSize: file.size,
        });

        assertActionOk(signResult);

        const signedUpload = signResult?.data;

        if (!signedUpload) {
          throw new Error("Failed to get upload URL");
        }

        await uploadAsset({ url: signedUpload.url, file });

        assertActionOk(await persistUpload(signedUpload.key));

        options?.onSuccess?.();
      } catch (error) {
        if (!(error instanceof ActionFailedError)) {
          toast.error(
            t("assetUploadError", {
              defaultValue: "Failed to upload",
            }),
            {
              description: t("assetUploadErrorDescription", {
                defaultValue:
                  "There was an issue uploading your file. Please try again later.",
              }),
            },
          );
        }
      }
    });
  };

  return { upload, isUploading };
}
