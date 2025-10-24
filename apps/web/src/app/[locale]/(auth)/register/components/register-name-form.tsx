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
import { PasswordInput } from "@rallly/ui/password-input";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { setVerificationEmail } from "@/app/[locale]/(auth)/login/actions";
import { Trans } from "@/components/trans";
import { PasswordStrengthMeter } from "@/features/password/components/password-strength-meter";
import { useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { getBrowserTimeZone } from "@/utils/date-time-utils";
import { validateRedirectUrl } from "@/utils/redirect";
import { registerNameFormSchema } from "./schema";

type RegisterNameFormValues = z.infer<typeof registerNameFormSchema>;

export function RegisterNameForm() {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const form = useForm<RegisterNameFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    resolver: zodResolver(registerNameFormSchema),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          const validatedRedirectTo = validateRedirectUrl(
            searchParams.get("redirectTo"),
          );

          const verifyURL = absoluteUrl(
            `/login/verify${
              validatedRedirectTo
                ? `?redirectTo=${encodeURIComponent(validatedRedirectTo)}`
                : ""
            }`,
          );

          try {
            const res = await authClient.signUp.email({
              email: data.email,
              password: data.password,
              name: data.name,
              timeZone: getBrowserTimeZone(),
              locale: i18n.language,
              callbackURL: verifyURL,
            });

            if (res.error) {
              switch (res.error.code) {
                case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
                  form.setError("email", {
                    message: t("userAlreadyExists"),
                  });
                  break;
                case "EMAIL_BLOCKED":
                  form.setError("email", {
                    message: t("emailNotAllowed"),
                  });
                  break;
                case "TEMPORARY_EMAIL_NOT_ALLOWED":
                  form.setError("email", {
                    message: t("temporaryEmailNotAllowed"),
                  });
                  break;
                default:
                  form.setError("email", {
                    message: res.error.message,
                  });
                  break;
              }
            }

            if (res.data?.user?.email) {
              await setVerificationEmail(res.data.user.email);
              router.push(verifyURL);
            }
          } catch (error) {
            if (error instanceof Error) {
              form.setError("root", {
                message: error.message,
              });
            }
            console.error(error);
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="password" defaults="Password" />
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    size="lg"
                    placeholder="••••••••"
                    disabled={form.formState.isSubmitting}
                    {...field}
                    type="password"
                  />
                </FormControl>
                <PasswordStrengthMeter
                  password={field.value}
                  className="mt-2"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {form.formState.errors.root?.message ? (
          <FormMessage>{form.formState.errors.root.message}</FormMessage>
        ) : null}
        <div className="mt-6">
          <Button
            loading={form.formState.isSubmitting}
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
