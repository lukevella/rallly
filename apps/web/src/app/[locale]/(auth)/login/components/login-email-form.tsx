"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@rallly/ui/form";
import { Icon } from "@rallly/ui/icon";
import { Input } from "@rallly/ui/input";
import { MailIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { getUserExists } from "@/app/[locale]/(auth)/login/actions/get-user-exists";
import { Trans } from "@/components/trans";

function useLoginWithEmailSchema() {
  const { t } = useTranslation();
  return React.useMemo(() => {
    return z.object({
      identifier: z.string().email(t("validEmail")),
    });
  }, [t]);
}

type LoginWithEmailValues = z.infer<ReturnType<typeof useLoginWithEmailSchema>>;

export function LoginWithEmailForm() {
  const loginWithEmailSchema = useLoginWithEmailSchema();
  const searchParams = useSearchParams();
  const form = useForm<LoginWithEmailValues>({
    defaultValues: {
      identifier: "",
    },
    resolver: zodResolver(loginWithEmailSchema),
  });
  const { handleSubmit, formState } = form;
  const { t } = useTranslation();

  return (
    <Form {...form}>
      <form
        className="space-y-2.5"
        onSubmit={handleSubmit(async ({ identifier }) => {
          const doesExist = await getUserExists(identifier);
          if (doesExist) {
            await signIn("email", {
              email: identifier,
              callbackUrl: searchParams?.get("callbackUrl") ?? undefined,
            });
          }
        })}
      >
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder={t("emailPlaceholder")}
                  data-1p-ignore
                  disabled={formState.isSubmitting}
                  autoFocus={true}
                  autoComplete="false"
                  error={!!formState.errors.identifier}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <Button
            loading={form.formState.isSubmitting}
            type="submit"
            className="w-full"
            variant="primary"
          >
            <Trans
              i18nKey="continueWith"
              defaults="Continue with {provider}"
              values={{ provider: t("email") }}
            />
          </Button>
        </div>
      </form>
    </Form>
  );
}
