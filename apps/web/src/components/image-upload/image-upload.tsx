"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import { ImageCropDialog } from "@/components/image-upload/image-crop-dialog";
import type {
  ImageUploadControlProps,
  ImageUploadPreviewProps,
  ImageUploadProps,
} from "@/components/image-upload/types";
import { allowedMimeTypes } from "@/components/image-upload/types";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import {
  createImagePreviewUrl,
  validateImageFile,
} from "@/lib/image-processing";
import { useSafeAction } from "@/lib/safe-action/client";
import { getImageUploadUrlAction } from "@/lib/storage/actions";
import { uploadImage } from "@/lib/storage/image-upload";

export function ImageUpload({ className, children }: ImageUploadProps) {
  return (
    <div className={cn("flex items-center gap-x-4", className)}>{children}</div>
  );
}

export function ImageUploadControl({
  keyPrefix,
  onUploadSuccess,
  onRemoveSuccess,
  hasCurrentImage = false,
}: ImageUploadControlProps) {
  const isStorageEnabled = useFeatureFlag("storage");

  const { t } = useTranslation();
  const [isRemoving, startRemoving] = React.useTransition();
  const [isUploading, startUploading] = React.useTransition();
  const getUploadUrl = useSafeAction(getImageUploadUrlAction);

  // Cropping state
  const [showCropDialog, setShowCropDialog] = React.useState(false);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [originalFile, setOriginalFile] = React.useState<File | null>(null);
  const [imagePreviewCleanup, setImagePreviewCleanup] = React.useState<
    (() => void) | null
  >(null);

  // File input ref to avoid ID collisions
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.success) {
      switch (validation.error) {
        case "invalidFileType":
          toast.message(
            t("invalidFileType", {
              defaultValue: "Invalid file type",
            }),
            {
              description: t("invalidFileTypeDescription", {
                defaultValue: "Please upload a JPG or PNG file.",
              }),
            },
          );
          break;
        case "fileTooLarge":
          toast.message(
            t("fileTooLarge", {
              defaultValue: "File too large",
            }),
            {
              description: t("fileTooLargeDescription", {
                defaultValue: "Please upload a file smaller than 2MB.",
              }),
            },
          );
          break;
        default: {
          // Exhaustive check - this should never happen
          const _exhaustive: never = validation.error;
          throw new Error(`Unhandled validation error: ${_exhaustive}`);
        }
      }
      return;
    }

    // Create preview URL and show cropping dialog
    const { url, cleanup } = createImagePreviewUrl(file);
    setOriginalFile(file);
    setImageToCrop(url);
    setImagePreviewCleanup(() => cleanup);
    setShowCropDialog(true);

    // Reset the input
    event.target.value = "";
  };

  const handleCropComplete = async (croppedFile: File) => {
    if (!originalFile) return;

    const parsedFileType = allowedMimeTypes.parse(croppedFile.type);

    startUploading(async () => {
      try {
        const result = await getUploadUrl.executeAsync({
          keyPrefix,
          fileType: parsedFileType,
          fileSize: croppedFile.size,
        });

        if (!result.data) {
          throw new Error("Failed to get upload URL");
        }

        const { url, fields } = result.data;

        await uploadImage({
          file: croppedFile,
          url,
          fileType: parsedFileType,
        });

        onUploadSuccess(fields.key);
        handleCloseCropDialog();
      } catch {
        toast.error(
          t("errorUploadPicture", {
            defaultValue: "Failed to upload",
          }),
          {
            description: t("errorUploadPictureDescription", {
              defaultValue:
                "There was an issue uploading your picture. Please try again later.",
            }),
          },
        );
      }
    });
  };

  const handleCloseCropDialog = () => {
    setShowCropDialog(false);
    setImageToCrop(null);
    setOriginalFile(null);

    // Cleanup the image preview URL
    if (imagePreviewCleanup) {
      imagePreviewCleanup();
      setImagePreviewCleanup(null);
    }
  };

  const handleRemove = async () => {
    startRemoving(async () => {
      await onRemoveSuccess();
    });
  };

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <div className="flex gap-2">
          <Button
            loading={isUploading}
            disabled={!isStorageEnabled}
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <Trans i18nKey="uploadImage" defaults="Upload" />
          </Button>
          {hasCurrentImage ? (
            <Button loading={isRemoving} variant="ghost" onClick={handleRemove}>
              <Trans i18nKey="removeImage" defaults="Remove" />
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">
          <Trans
            i18nKey="imageUploadDescription"
            defaults="Up to 2MB, JPG or PNG"
          />
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <ImageCropDialog
        open={showCropDialog}
        imageSrc={imageToCrop}
        originalFile={originalFile}
        isUploading={isUploading}
        onClose={handleCloseCropDialog}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}

export function ImageUploadPreview({
  className,
  children,
}: ImageUploadPreviewProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>{children}</div>
  );
}
