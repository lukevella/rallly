import { Button } from "@/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/form";
import { TextInput } from "@/components/text-input";
import { Trans } from "@/components/trans";
import { UserAvatar } from "@/components/user";
import { useUser } from "@/components/user-provider";
import { trpc } from "@rallly/backend";
import { useForm } from "react-hook-form";

export const ProfileSettings = () => {
  const { user } = useUser();

  const form = useForm<{
    name: string;
  }>({
    defaultValues: {
      name: user.isGuest ? "" : user.name,
    },
  });

  const { control, watch, handleSubmit, formState, reset } = form;

  const watchName = watch("name");

  const queryClient = trpc.useContext();
  const changeName = trpc.user.changeName.useMutation({
    onSuccess: () => {
      queryClient.whoami.invalidate();
    },
  });
  return (
    <div className="grid gap-y-4">
      <Form {...form}>
        <form
          onSubmit={handleSubmit(async (data) => {
            await changeName.mutateAsync({ name: data.name });
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
                    <TextInput id="name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="mt-4 flex">
              <Button
                loading={formState.isSubmitting}
                type="primary"
                htmlType="submit"
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
