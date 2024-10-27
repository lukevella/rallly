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

import { useTranslation } from "@/app/i18n/client";
import { Trans } from "@/components/trans";

import { registerNameFormSchema } from "./schema";
import { trpc } from "@/utils/trpc/client";
import { useRouter } from "next/navigation";
import { setToken } from "../actions";

type RegisterNameFormValues = z.infer<typeof registerNameFormSchema>;

export function RegisterNameForm() {
  const { t } = useTranslation();
  const form = useForm<RegisterNameFormValues>({
    defaultValues: {
      name: "",
      email: "",
    },
    resolver: zodResolver(registerNameFormSchema),
  });

  const registerUser = trpc.auth.requestRegistration.useMutation();
  const router = useRouter();
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          const res = await registerUser.mutateAsync(data);

          if (res.ok) {
            await setToken(res.token);
            router.push("/register/verify");
          } else {
            switch (res.reason) {
              case "emailNotAllowed":
                form.setError("email", {
                  message: t("emailNotAllowed"),
                });
                break;
              case "userAlreadyExists":
                form.setError("email", {
                  message: t("userAlreadyExists"),
                });
                break;
            }
          }
        })}
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="name" defaults="Name" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      data-1p-ignore
                      disabled={form.formState.isSubmitting}
                      autoFocus={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="email" defaults="Email" />
                </FormLabel>
                <FormControl>
                  <Input disabled={form.formState.isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="mt-6">
          <Button
            loading={
              form.formState.isSubmitting || form.formState.isSubmitSuccessful
            }
            className="w-full"
            variant="primary"
            type="submit"
          >
            <Trans i18nKey="continue" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
