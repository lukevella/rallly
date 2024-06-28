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

import { InputOTP } from "@/app/[locale]/(auth)/login/components/input-otp";
import { LoginWizardError } from "@/app/[locale]/(auth)/login/login-wizard/errors";
import {
  useLoginWizard,
  useLoginWizardProps,
} from "@/app/[locale]/(auth)/login/login-wizard/login-wizard";
import { SSOMenu } from "@/app/[locale]/(auth)/login/login-wizard/sso-menu";
import { useTranslation } from "@/app/i18n/client";
import { Trans } from "@/components/trans";

const loginOtpFormSchema = z.object({
  otp: z.string().length(6),
});

type LoginOtpFormValues = z.infer<typeof loginOtpFormSchema>;

export function SignUpOtp() {
  const { dispatch } = useLoginWizard();
  const { finishSignUp } = useLoginWizardProps();
  const { t } = useTranslation();
  const form = useForm<LoginOtpFormValues>({
    defaultValues: {
      otp: "",
    },
    resolver: zodResolver(loginOtpFormSchema),
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await finishSignUp(data);
    } catch (error) {
      if (error instanceof LoginWizardError) {
        switch (error.code) {
          case "invalidOTP": {
            form.setError("otp", {
              type: "manual",
              message: t("wrongVerificationCode"),
            });
            break;
          }
        }
      }
    }
  });
  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <div className="flex items-start gap-2">
          <button
            className="inlie-block h-7"
            onClick={() => {
              dispatch({ type: "setStep", step: "signup-name" });
            }}
          >
            <Icon>
              <ChevronLeftIcon />
            </Icon>
          </button>
          <h1 className="text-lg font-bold tracking-tight">
            <Trans i18nKey="finishSigningUp" defaults="Finish Signing Up" />
          </h1>
        </div>

        <p className="text-muted-foreground text-sm">
          <Trans
            i18nKey="enterCodeInstruction"
            defaults="Check and enter the code we sent you."
          />
        </p>
      </div>
      <Form {...form}>
        <form className="space-y-6" onSubmit={handleSubmit}>
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
                      autoFocus={true}
                      onValidCode={() => handleSubmit()}
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
