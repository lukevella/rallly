"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@rallly/ui/form";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";

import { InputOTP } from "../../../../../../components/input-otp";

const otpFormSchema = z.object({
  otp: z.string().length(6),
});

type OTPFormValues = z.infer<typeof otpFormSchema>;

export function OTPForm({ email }: { email: string }) {
  const { t } = useTranslation();
  const form = useForm<OTPFormValues>({
    defaultValues: {
      otp: "",
    },
    resolver: zodResolver(otpFormSchema),
  });

  const searchParams = useSearchParams();
  const handleSubmit = form.handleSubmit(async (data) => {
    const url = `${
      window.location.origin
    }/api/auth/callback/email?email=${encodeURIComponent(email)}&token=${data.otp}`;

    const res = await fetch(url);
    const resUrl = new URL(res.url);

    const hasError = !!resUrl.searchParams.get("error");

    if (hasError) {
      form.setError("otp", {
        message: t("wrongVerificationCode"),
      });
    } else {
      window.location.href = searchParams?.get("redirectTo") ?? "/";
    }
  });

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <InputOTP
                    size="lg"
                    placeholder={t("verificationCodePlaceholder")}
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
        <Button
          className="w-full"
          variant="primary"
          size="lg"
          type="submit"
          loading={
            form.formState.isSubmitting || form.formState.isSubmitSuccessful
          }
        >
          <Trans i18nKey="login" defaults="Login" />
        </Button>
      </form>
    </Form>
  );
}
