import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { useForm } from "react-hook-form";

import { TextInput } from "@/components/text-input";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";

export const ChangeEmailForm = () => {
  const { user } = useUser();

  const form = useForm<{
    email: string;
  }>({
    defaultValues: {
      email: user.isGuest ? "" : user.email,
    },
  });

  if (user.isGuest) {
    return null;
  }

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <Trans i18nKey="email" />
            </FormLabel>
            <FormControl>
              <TextInput {...field} disabled={true} />
            </FormControl>
          </FormItem>
        )}
      />
      {/* <div className="mt-6 flex">
        <Button
          type="primary"
          disabled={!form.formState.isDirty}
          htmlType="submit"
        >
          <Trans i18nKey="save" />
        </Button>
      </div> */}
    </Form>
  );
};
