import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { useToast } from "@rallly/ui/hooks/use-toast";
import { Input } from "@rallly/ui/input";
import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useTranslation } from "@/app/i18n/client";
import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";

const allowedMimeTypes = ["image/jpeg", "image/png"];

function ChangeAvatarButton({
  onSuccess,
}: {
  onSuccess: (imageKey: string) => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const getAvatarUploadUrlMutation = trpc.user.getAvatarUploadUrl.useMutation();
  const updateAvatarMutation = trpc.user.updateAvatar.useMutation({
    onSuccess: (_res, input) => {
      onSuccess(input.imageKey);
    },
  });

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
      const res = await getAvatarUploadUrlMutation.mutateAsync({
        fileType,
        fileSize: file.size,
      });

      if (!res.success) {
        if (res.cause === "object-storage-not-enabled") {
          toast({
            title: t("featureNotAvailable", {
              defaultValue: "Feature not available",
            }),
            description: t("featureNotAvailableDescription", {
              defaultValue:
                "This feature requires object storage to be enabled.",
            }),
          });
          return;
        }
      }

      const { url, fields } = res;

      await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": fileType,
          "Content-Length": file.size.toString(),
        },
      });

      await updateAvatarMutation.mutateAsync({
        imageKey: fields.key,
      });
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
  const { refresh } = useUser();
  const removeAvatarMutation = trpc.user.removeAvatar.useMutation({
    onSuccess: () => {
      refresh({ image: null });
      onSuccess?.();
    },
  });

  return (
    <Button
      loading={removeAvatarMutation.isLoading}
      variant="ghost"
      onClick={() => {
        removeAvatarMutation.mutate();
      }}
    >
      <Trans i18nKey="removeAvatar" defaults="Remove" />
    </Button>
  );
}

export const ProfileSettings = () => {
  const { user, refresh } = useUser();

  const form = useForm<{
    name: string;
    email: string;
  }>({
    defaultValues: {
      name: user.isGuest ? "" : user.name,
      email: user.email ?? "",
    },
  });

  const { control, handleSubmit, formState, reset } = form;
  const posthog = usePostHog();
  return (
    <div className="grid gap-y-4">
      <Form {...form}>
        <form
          onSubmit={handleSubmit(async (data) => {
            await refresh({ name: data.name });
            reset(data);
          })}
        >
          <div className="flex flex-col gap-y-4">
            <div className="flex items-center gap-x-4">
              <CurrentUserAvatar size={56} />
              <div className="flex flex-col gap-y-2">
                <div className="flex gap-2">
                  <ChangeAvatarButton
                    onSuccess={(imageKey) => {
                      refresh({ image: imageKey });
                      posthog?.capture("upload profile picture");
                    }}
                  />
                  {user.image ? (
                    <RemoveAvatarButton
                      onSuccess={() => {
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
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="name">
                    <Trans i18nKey="name" />
                  </FormLabel>
                  <FormControl>
                    <Input id="name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="email" />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} disabled={true} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="mt-4 flex">
              <Button
                loading={formState.isSubmitting}
                variant="primary"
                type="submit"
                disabled={!formState.isDirty}
              >
                <Trans i18nKey="save" />
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
