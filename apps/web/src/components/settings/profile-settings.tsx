import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { useForm } from "react-hook-form";

import { Trans } from "@/components/trans";
import { UserAvatar } from "@/components/user";
import { useUser } from "@/components/user-provider";

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

  const { control, watch, handleSubmit, formState, reset } = form;

  const watchName = watch("name");

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
            <div>
              <UserAvatar name={watchName} size="lg" />
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
