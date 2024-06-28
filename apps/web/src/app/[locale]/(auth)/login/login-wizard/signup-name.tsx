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
import { Icon } from "@rallly/ui/icon";
import { Input } from "@rallly/ui/input";
import { ChevronLeftIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { LoginWizardError } from "@/app/[locale]/(auth)/login/login-wizard/errors";
import {
  useLoginWizard,
  useLoginWizardProps,
} from "@/app/[locale]/(auth)/login/login-wizard/login-wizard";
import { SSOMenu } from "@/app/[locale]/(auth)/login/login-wizard/sso-menu";
import { useTranslation } from "@/app/i18n/client";
import { Trans } from "@/components/trans";

const registerNameFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

type RegisterNameFormValues = z.infer<typeof registerNameFormSchema>;

export function SignUpName() {
  const { state, dispatch } = useLoginWizard();

  const { initiateSignUp } = useLoginWizardProps();
  const { t } = useTranslation();
  const form = useForm<RegisterNameFormValues>({
    defaultValues: {
      name: state.name,
      email: state.email,
    },
    resolver: zodResolver(registerNameFormSchema),
  });
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="inline-block h-7"
            onClick={() => {
              dispatch({ type: "setStep", step: "menu" });
            }}
          >
            <Icon>
              <ChevronLeftIcon />
            </Icon>
          </button>
          <h1 className="text-lg font-bold tracking-tight">
            <Trans i18nKey="signUpTitle" defaults="Create your account" />
          </h1>
        </div>

        <p className="text-muted-foreground break-all text-sm">
          <Trans
            i18nKey="signUpDescription"
            defaults="Enter your details to continue"
          />
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (data) => {
            try {
              await initiateSignUp(data);
              dispatch({ type: "setName", name: data.name });
            } catch (error) {
              if (error instanceof LoginWizardError) {
                switch (error.code) {
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
            }
          })}
        >
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
                    {...field}
                    placeholder={t("emailPlaceholder")}
                    disabled={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                      placeholder={t("namePlaceholder")}
                      autoFocus={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <div>
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
      <SSOMenu />
    </div>
  );
}
