"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import { useAssetUpload } from "@/components/asset-upload/use-asset-upload";
import { ImageCropDialog } from "@/components/image-upload/image-crop-dialog";
import { Trans, useTranslation } from "@/i18n/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import { createImagePreviewUrl } from "@/lib/image-processing";
import type { AssetProfile } from "@/lib/storage/asset-profile";
import { validateAssetFile } from "@/lib/storage/asset-profile";

export function ImageUpload({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center gap-x-4", className)}>{children}</div>
  );
}

const fileTypeLabels: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/svg+xml": "SVG",
};

function formatFileTypes(accept: readonly string[], language: string): string {
  const labels = accept.map(
    (mimeType) =>
      fileTypeLabels[mimeType] ??
      mimeType.split("/").pop()?.toUpperCase() ??
      mimeType,
  );
  return new Intl.ListFormat(language, { type: "disjunction" }).format(labels);
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  }
  return `${Math.round(bytes / 1024)}KB`;
}

export function ImageUploadControl<TAccept extends string>({
  profile,
  signUpload,
  persistUpload,
  onRemove,
  hasCurrentImage = false,
  crop = false,
  disabled = false,
}: {
  /** The asset slot this control uploads into; drives validation and hints. */
  profile: AssetProfile & { accept: readonly [TAccept, ...TAccept[]] };
  /**
   * Run the selected file through the 1:1 crop dialog before uploading.
   * Only raster types can be cropped (the crop canvas cannot process SVG),
   * so this requires a raster-only profile.
   */
  crop?: boolean;
  signUpload: Parameters<typeof useAssetUpload<TAccept>>[0]["signUpload"];
  persistUpload: Parameters<typeof useAssetUpload<TAccept>>[0]["persistUpload"];
  onRemove: () => Promise<unknown>;
  hasCurrentImage?: boolean;
  disabled?: boolean;
}) {
  const isStorageEnabled = useFeatureFlag("storage");

  const { t, i18n } = useTranslation();
  const [isRemoving, startRemoving] = React.useTransition();
  const { upload, isUploading } = useAssetUpload({
    signUpload,
    persistUpload,
  });

  const acceptedFormats = formatFileTypes(profile.accept, i18n.language);
  const maxFileSize = formatFileSize(profile.maxSize);

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

    const validation = validateAssetFile(file, profile);
    if (!validation.success) {
      switch (validation.error) {
        case "invalidFileType":
          toast.message(
            t("invalidFileType", {
              defaultValue: "Invalid file type",
            }),
            {
              description: t("imageUploadInvalidFileTypeDescription", {
                defaultValue: "Accepted formats: {formats}",
                formats: acceptedFormats,
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
              description: t("imageUploadFileTooLargeDescription", {
                defaultValue: "Please upload a file smaller than {size}.",
                size: maxFileSize,
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

    if (!crop) {
      upload(file);
      event.target.value = "";
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

    upload(croppedFile, { onSuccess: handleCloseCropDialog });
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
      await onRemove();
    });
  };

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <div className="flex gap-2">
          <Button
            loading={isUploading}
            disabled={disabled || !isStorageEnabled}
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <Trans i18nKey="chooseImage" defaults="Choose…" />
          </Button>
          {hasCurrentImage ? (
            <Button
              loading={isRemoving}
              disabled={disabled}
              variant="ghost"
              onClick={handleRemove}
            >
              <Trans i18nKey="removeImage" defaults="Remove" />
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">
          {t("imageUploadHint", {
            defaultValue: "Up to {size}, {formats}",
            size: maxFileSize,
            formats: acceptedFormats,
          })}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={profile.accept.join(",")}
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
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>{children}</div>
  );
}
