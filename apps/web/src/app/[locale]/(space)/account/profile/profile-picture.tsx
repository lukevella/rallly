"use client";

import { usePostHog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import React, { useState } from "react";
import { z } from "zod";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { useTranslation } from "@/i18n/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import { trpc } from "@/trpc/client";

const allowedMimeTypes = z.enum(["image/jpeg", "image/png"]);

function ChangeAvatarButton({ onSuccess }: { onSuccess: () => void }) {
  const getPresignedUrl = trpc.user.getAvatarUploadUrl.useMutation();
  const updateAvatar = trpc.user.updateAvatar.useMutation();
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);

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
    setIsUploading(true);
    try {
      // Get pre-signed URL
      const res = await getPresignedUrl.mutateAsync({
        fileType,
        fileSize: file.size,
      });

      const { url, fields } = res;

      await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": fileType,
          "Content-Length": file.size.toString(),
        },
      });

      await updateAvatar.mutateAsync({
        imageKey: fields.key,
      });

      onSuccess();
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
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button
        loading={isUploading}
        onClick={() => {
          document.getElementById("avatar-upload")?.click();
        }}
      >
        <Trans i18nKey="uploadProfilePicture" defaults="Upload" />
      </Button>
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}

function RemoveAvatarButton({ onSuccess }: { onSuccess?: () => void }) {
  const [isLoading, setLoading] = React.useState(false);
  const removeAvatar = trpc.user.removeAvatar.useMutation();
  return (
    <Button
      loading={isLoading}
      variant="ghost"
      onClick={async () => {
        setLoading(true);
        try {
          await removeAvatar.mutateAsync();
          onSuccess?.();
        } finally {
          setLoading(false);
        }
      }}
    >
      <Trans i18nKey="removeAvatar" defaults="Remove" />
    </Button>
  );
}

function Upload() {
  const { user, refresh } = useUser();

  const posthog = usePostHog();

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex gap-2">
        <ChangeAvatarButton
          onSuccess={() => {
            refresh();
            posthog?.capture("upload profile picture");
          }}
        />
        {user.image ? (
          <RemoveAvatarButton
            onSuccess={() => {
              refresh();
              posthog?.capture("remove profile picture");
            }}
          />
        ) : null}
      </div>
      <p className="text-muted-foreground text-xs">
        <Trans
          i18nKey="profilePictureDescription"
          defaults="Up to 2MB, JPG or PNG"
        />
      </p>
    </div>
  );
}

export function ProfilePicture({
  name,
  image,
}: {
  name: string;
  image?: string;
}) {
  const isStorageEnabled = useFeatureFlag("storage");
  return (
    <div className="flex items-center gap-x-4">
      <OptimizedAvatarImage src={image} name={name} size="lg" />
      {isStorageEnabled ? <Upload /> : null}
    </div>
  );
}
