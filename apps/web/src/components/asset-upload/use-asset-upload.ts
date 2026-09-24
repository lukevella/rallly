"use client";

import {
  hasServerError,
  isActionMutationError,
} from "@next-safe-action/adapter-tanstack-query";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import { useTranslation } from "@/i18n/client";
import { uploadAsset } from "@/lib/storage/upload-client";

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
  }) => Promise<{ url: string; key: string }>;
  persistUpload: (key: string) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [isUploading, startUploading] = React.useTransition();

  const showUploadError = () => {
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
  };

  const upload = (file: File, options?: { onSuccess?: () => void }) => {
    startUploading(async () => {
      try {
        const signedUpload = await signUpload({
          fileType: file.type as TAccept,
          fileSize: file.size,
        });

        try {
          await uploadAsset({ url: signedUpload.url, file });
        } catch {
          showUploadError();
          return;
        }

        await persistUpload(signedUpload.key);

        options?.onSuccess?.();
      } catch (error) {
        // The mutation cache toasts server errors and failed requests;
        // only validation errors are left to report here
        if (isActionMutationError(error) && !hasServerError(error)) {
          showUploadError();
        }
      }
    });
  };

  return { upload, isUploading };
}
