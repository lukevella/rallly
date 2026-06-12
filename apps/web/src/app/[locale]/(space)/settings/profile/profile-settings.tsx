"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { updateUserNameAction } from "@/features/user/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { trpc } from "@/trpc/client";

import { ProfilePicture } from "./profile-picture";

const profileSettingsFormData = z.object({
  name: z.string().min(1).max(100),
});

export const ProfileSettings = () => {
  const [user] = trpc.user.getAuthed.useSuspenseQuery();

  const updateUserName = useSafeAction(updateUserNameAction);
  const form = useForm({
    defaultValues: {
      name: user.name,
    },
    resolver: zodResolver(profileSettingsFormData),
  });

  const { control, handleSubmit, formState, reset } = form;
  return (
    <div className="grid gap-y-4">
      <Form {...form}>
        <form
          onSubmit={handleSubmit(async (data) => {
            if (data.name !== user.name) {
              await updateUserName.executeAsync({ name: data.name });
            }
            reset(data);
          })}
        >
          <div className="flex flex-col gap-y-4">
            <ProfilePicture name={user.name} image={user.image} />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-4 flex">
              <Button
                loading={formState.isSubmitting}
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
