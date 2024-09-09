import { Button } from "@rallly/ui/button";
import { useToast } from "@rallly/ui/hooks/use-toast";
import * as Sentry from "@sentry/nextjs";
import React, { useState } from "react";

import {
  getPresignedUrl,
  removeAvatar,
  updateAvatar,
} from "@/app/[locale]/(admin)/settings/profile/actions";
import { useTranslation } from "@/app/i18n/client";
import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePostHog } from "@/utils/posthog";

const allowedMimeTypes = ["image/jpeg", "image/png"];

function ChangeAvatarButton({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useUser();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const fileType = file.type;

    if (!allowedMimeTypes.includes(fileType)) {
      toast({
        title: t("invalidFileType", {
          defaultValue: "Invalid file type",
        }),
        description: t("invalidFileTypeDescription", {
          defaultValue: "Please upload a JPG or PNG file.",
        }),
      });
      Sentry.captureMessage("Invalid file type", {
        level: "info",
        extra: {
          fileType,
        },
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t("fileTooLarge", {
          defaultValue: "File too large",
        }),
        description: t("fileTooLargeDescription", {
          defaultValue: "Please upload a file smaller than 2MB.",
        }),
      });
      Sentry.captureMessage("File too large", {
        level: "info",
        extra: {
          fileSize: file.size,
        },
      });
      return;
    }
    setIsUploading(true);
    try {
      // Get pre-signed URL
      const res = await getPresignedUrl({
        userId: user.id,
        fileType: fileType as "image/jpeg" | "image/png",
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

      await updateAvatar({
        userId: user.id,
        image: fields.key,
      });

      onSuccess();
    } catch (error) {
      console.error(error);
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
  const { user } = useUser();
  const [isLoading, setLoading] = React.useState(false);
  return (
    <Button
      loading={isLoading}
      variant="ghost"
      onClick={async () => {
        setLoading(true);
        try {
          await removeAvatar({ userId: user.id });
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

export const AvatarUpload = () => {
  const { user, refresh } = useUser();

  const posthog = usePostHog();
  return (
    <div className="flex items-center gap-x-4">
      <CurrentUserAvatar size={56} />
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
    </div>
  );
};
