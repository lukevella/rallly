"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import { z } from "zod";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { getImageUploadUrlAction } from "@/lib/storage/actions";
import { uploadImage } from "@/lib/storage/image-upload";

const allowedMimeTypes = z.enum(["image/jpeg", "image/png"]);

export interface ImageUploadControlProps {
  keyPrefix: "avatars" | "spaces";
  onUploadSuccess: (imageKey: string) => Promise<void> | void;
  onRemoveSuccess: () => Promise<void> | void;
  hasCurrentImage?: boolean;
}

export interface ImageUploadPreviewProps {
  className?: string;
  children?: React.ReactNode;
}

export function ImageUpload({ children }: { children?: React.ReactNode }) {
  return <div className="flex items-center gap-x-4">{children}</div>;
}

export function ImageUploadControl({
  keyPrefix,
  onUploadSuccess,
  onRemoveSuccess,
  hasCurrentImage = false,
}: ImageUploadControlProps) {
  const { t } = useTranslation();
  const [isRemoving, startRemoving] = React.useTransition();
  const [isUploading, startUploading] = React.useTransition();
  const getUploadUrl = useSafeAction(getImageUploadUrlAction);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const parsedFileType = allowedMimeTypes.safeParse(file.type);

    if (!parsedFileType.success) {
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
      return;
    }

    const fileType = parsedFileType.data;

    if (file.size > 2 * 1024 * 1024) {
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
      return;
    }

    startUploading(async () => {
      try {
        const result = await getUploadUrl.executeAsync({
          keyPrefix,
          fileType,
          fileSize: file.size,
        });

        if (!result.data) {
          throw new Error("Failed to get upload URL");
        }

        const { url, fields } = result.data;

        await uploadImage({
          file,
          url,
          fileType,
        });

        onUploadSuccess(fields.key);
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

  const handleRemove = async () => {
    startRemoving(async () => {
      await onRemoveSuccess();
    });
  };

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex gap-2">
        <Button
          loading={isUploading}
          onClick={() => {
            document.getElementById("image-upload")?.click();
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
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
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
