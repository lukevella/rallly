import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { trpc } from "@/utils/trpc/client";

const allowedMimeTypes = ["image/jpeg", "image/png"];

function ChangeAvatarButton({
  onSuccess,
}: {
  onSuccess: (imageKey: string) => void;
}) {
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
      alert("Invalid file type");
      return;
    }

    setIsUploading(true);
    try {
      // Get pre-signed URL
      const { url, fields } = await getAvatarUploadUrlMutation.mutateAsync({
        fileType,
        fileSize: file.size,
      });

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
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button
        loading={isUploading}
        onClick={() => {
          // trigger file input
          document.getElementById("avatar-upload")?.click();
        }}
      >
        <Trans i18nKey="changeAvatar" defaults="Change Avatar" />
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
              <CurrentUserAvatar className="size-14" />
              <ChangeAvatarButton
                onSuccess={(imageKey) => {
                  refresh({ image: imageKey });
                }}
              />
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
