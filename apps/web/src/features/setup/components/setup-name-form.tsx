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
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Trans, useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";

const setupNameFormSchema = z.object({
  name: z.string().min(1).max(100),
});

export function SetupNameForm() {
  const { t } = useTranslation();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(setupNameFormSchema),
    defaultValues: {
      name: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async ({ name }) => {
          // Accounts created through the OTP registration flow have no
          // timezone yet; capture it here the way the old signup form did.
          const res = await authClient.updateUser({
            name,
            timeZone: getBrowserTimeZone(),
          });

          if (res.error) {
            form.setError("root", {
              message: res.error.message,
            });
            return;
          }

          router.refresh();
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="name" defaults="Name" />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  large
                  autoComplete="name"
                  data-1p-ignore
                  placeholder={t("namePlaceholder")}
                  disabled={form.formState.isSubmitting}
                  autoFocus={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root?.message ? (
          <FormMessage>{form.formState.errors.root.message}</FormMessage>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          size="xl"
          loading={
            form.formState.isSubmitting || form.formState.isSubmitSuccessful
          }
          className="w-full"
        >
          <Trans i18nKey="continue" defaults="Continue" />
        </Button>
      </form>
    </Form>
  );
}
