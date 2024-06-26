import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Icon } from "@rallly/ui/icon";
import { ChevronLeftIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { InputOTP } from "@/app/[locale]/(unauthenticated)/login/components/input-otp";
import {
  useLoginWizard,
  useLoginWizardProps,
} from "@/app/[locale]/(unauthenticated)/login/login-wizard/login-wizard";
import { SSOMenu } from "@/app/[locale]/(unauthenticated)/login/login-wizard/sso-menu";
import { useTranslation } from "@/app/i18n/client";
import { Trans } from "@/components/trans";

const loginOtpFormSchema = z.object({
  otp: z.string().length(6),
});

type LoginOtpFormValues = z.infer<typeof loginOtpFormSchema>;

export function LoginOtp() {
  const { state, dispatch } = useLoginWizard();
  const { onLogin } = useLoginWizardProps();

  const { t } = useTranslation();
  const form = useForm<LoginOtpFormValues>({
    defaultValues: {
      otp: "",
    },
    resolver: zodResolver(loginOtpFormSchema),
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    const res = await onLogin(state.email, data.otp);

    if (res?.error) {
      form.setError("otp", {
        message: t("wrongVerificationCode"),
      });
    }
  });

  return (
    <div className="space-y-4">
      <div className="space-y-0.5">
        <div className="flex items-start gap-2">
          <button
            className="inlie-block h-7"
            onClick={() => {
              dispatch({ type: "setStep", step: "menu" });
            }}
          >
            <Icon>
              <ChevronLeftIcon />
            </Icon>
          </button>
          <h1 className="text-lg font-bold tracking-tight">
            <Trans i18nKey="finishLoggingIn" defaults="Finish logging in" />
          </h1>
        </div>

        <p className="text-muted-foreground text-sm">
          <Trans
            i18nKey="enterCode"
            values={{ email: state.email }}
            defaults="Enter the code we sent to {email}"
          />
        </p>
      </div>
      <Form {...form}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="verificationCode" defaults="Code" />
                  </FormLabel>
                  <FormControl>
                    <InputOTP
                      disabled={
                        form.formState.isSubmitting ||
                        form.formState.isSubmitSuccessful
                      }
                      autoFocus={true}
                      onValidCode={() => {
                        handleSubmit();
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    <Trans i18nKey="verificationCodeHelp" />
                  </FormDescription>
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
