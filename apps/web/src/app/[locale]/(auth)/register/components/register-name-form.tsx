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
import type { z } from "zod";

import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

import { setToken } from "../actions";
import { registerNameFormSchema } from "./schema";
import { signIn } from "next-auth/react";

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
          try {
            const res = await registerUser.mutateAsync(data);

            if (res.ok) {
              await setToken(res.token);
              router.push("/register/verify");
            } else if (res.reason === "emailNotAllowed") {
              form.setError("email", {
                message: t("emailNotAllowed"),
              });
            } else if (res.reason === "userAlreadyExists") {
              // Attempt to sign in silently
              const signInResult = await signIn("email", {
                email: data.email,
                redirect: false,
              });

              if (signInResult?.error) {
                throw new Error(signInResult.error);
              }

              // Only redirect if sign in was successful
              router.push("/login/verify");
            }
          } catch (error) {
            form.setError("email", {
              message: t("authError", {
                defaultValue: "An error occurred during authentication",
              }),
            });
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
                      size="lg"
                      data-1p-ignore
                      placeholder={t("namePlaceholder")}
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
                  <Input
                    size="lg"
                    placeholder={t("emailPlaceholder")}
                    disabled={form.formState.isSubmitting}
                    {...field}
                  />
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
            size="lg"
          >
            <Trans i18nKey="continue" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
