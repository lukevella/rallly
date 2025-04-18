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
import { z } from "zod";

import { Trans } from "@/components/trans";
import { trpc } from "@/trpc/client";

import { ProfilePicture } from "./profile-picture";
import { useRouter } from "next/navigation";

const profileSettingsFormData = z.object({
  name: z.string().min(1).max(100),
});

type ProfileSettingsFormData = z.infer<typeof profileSettingsFormData>;

export const ProfileSettings = ({
  name,
  image,
}: {
  name: string;
  image?: string;
}) => {
  const changeName = trpc.user.changeName.useMutation();
  const router = useRouter();
  const form = useForm<ProfileSettingsFormData>({
    defaultValues: {
      name,
    },
    resolver: zodResolver(profileSettingsFormData),
  });

  const { control, handleSubmit, formState, reset } = form;
  return (
    <div className="grid gap-y-4">
      <Form {...form}>
        <form
          onSubmit={handleSubmit(async (data) => {
            if (data.name !== name) {
              await changeName.mutateAsync({ name: data.name });
            }
            reset(data);
            router.refresh();
          })}
        >
          <div className="flex flex-col gap-y-4">
            <ProfilePicture name={name} image={image} />
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
