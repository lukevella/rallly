"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { AtSignIcon, ImageIcon, UserIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Setting,
  SettingControl,
  SettingDescription,
  SettingIcon,
  SettingsGroup,
  SettingTitle,
} from "@/components/setting";
import { updateUserNameAction } from "@/features/user/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { ChangeEmailDialog } from "./change-email-dialog";
import { ProfilePicture } from "./profile-picture";

const nameFormData = z.object({
  name: z.string().min(1).max(100),
});

function NameSetting({ name }: { name: string }) {
  const updateUserName = useSafeAction(updateUserNameAction);
  const form = useForm({
    defaultValues: { name },
    resolver: zodResolver(nameFormData),
  });

  const { control, handleSubmit, formState, reset } = form;

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(async (data) => {
          if (data.name !== name) {
            await updateUserName.executeAsync({ name: data.name });
          }
          reset(data);
        })}
      >
        <Setting>
          <SettingIcon>
            <UserIcon />
          </SettingIcon>
          <SettingTitle>
            <Trans i18nKey="name" defaults="Name" />
          </SettingTitle>
          <SettingDescription>
            <Trans
              i18nKey="nameSettingDescription"
              defaults="The name shown on your polls and to participants."
            />
          </SettingDescription>
          <SettingControl>
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input className="w-56" autoComplete="name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </SettingControl>
        </Setting>
        {formState.isDirty ? (
          <div className="flex justify-end pb-4">
            <Button
              variant="primary"
              type="submit"
              loading={formState.isSubmitting}
            >
              <Trans i18nKey="save" defaults="Save" />
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}

function EmailSetting({ email }: { email: string }) {
  const dialog = useDialog();

  return (
    <Setting>
      <SettingIcon>
        <AtSignIcon />
      </SettingIcon>
      <SettingTitle>
        <Trans i18nKey="email" defaults="Email" />
      </SettingTitle>
      <SettingDescription>{email}</SettingDescription>
      <SettingControl>
        <Button {...dialog.triggerProps}>
          <Trans i18nKey="changeEmail" defaults="Change…" />
        </Button>
      </SettingControl>
      <ChangeEmailDialog email={email} {...dialog.dialogProps} />
    </Setting>
  );
}

function PictureSetting({ name, image }: { name: string; image?: string }) {
  return (
    <Setting>
      <SettingIcon>
        <ImageIcon />
      </SettingIcon>
      <SettingTitle>
        <Trans i18nKey="picture" defaults="Picture" />
      </SettingTitle>
      <SettingDescription>
        <Trans
          i18nKey="pictureSettingDescription"
          defaults="A picture helps people recognise you."
        />
      </SettingDescription>
      <SettingControl>
        <ProfilePicture name={name} image={image} />
      </SettingControl>
    </Setting>
  );
}

export const ProfileSettings = ({
  name,
  image,
  email,
}: {
  name: string;
  image?: string;
  email: string;
}) => {
  return (
    <SettingsGroup>
      <PictureSetting name={name} image={image} />
      <NameSetting name={name} />
      <EmailSetting email={email} />
    </SettingsGroup>
  );
};
