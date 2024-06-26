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
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useTranslation } from "@/app/i18n/client";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";

import { InputOTP } from "./input-otp";

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

  const router = useRouter();
  const { refresh } = useUser();

  const handleSubmit = form.handleSubmit(async (data) => {
    const url = `${
      window.location.origin
    }/api/auth/callback/email?email=${encodeURIComponent(email)}&token=${data.otp}`;

    const res = await fetch(url);
    const hasError = res.url.includes("auth/error");

    await refresh();

    if (hasError) {
      form.setError("otp", {
        message: t("wrongVerificationCode"),
      });
    } else {
      router.push("/");
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
          type="submit"
          loading={form.formState.isSubmitting}
        >
          <Trans i18nKey="continue" defaults="Continue" />
        </Button>
      </form>
    </Form>
  );
}
