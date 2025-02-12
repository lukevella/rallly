"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePostHog } from "@rallly/posthog/client";
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
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { InputOTP } from "@/components/input-otp";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { useDayjs } from "@/utils/dayjs";

const otpFormSchema = z.object({
  otp: z.string().length(6),
});

type OTPFormValues = z.infer<typeof otpFormSchema>;

export function OTPForm({ token }: { token: string }) {
  const { t, i18n } = useTranslation();
  const form = useForm<OTPFormValues>({
    defaultValues: {
      otp: "",
    },
    resolver: zodResolver(otpFormSchema),
  });

  const { timeZone } = useDayjs();

  const locale = i18n.language;

  const queryClient = trpc.useUtils();
  const posthog = usePostHog();
  const authenticateRegistration =
    trpc.auth.authenticateRegistration.useMutation();
  const searchParams = useSearchParams();
  const handleSubmit = form.handleSubmit(async (data) => {
    // get user's time zone
    const res = await authenticateRegistration.mutateAsync({
      token,
      timeZone,
      locale,
      code: data.otp,
    });

    if (!res.user) {
      throw new Error("Failed to authenticate user");
    }

    queryClient.invalidate();

    posthog?.identify(res.user.id, {
      email: res.user.email,
      name: res.user.name,
    });

    signIn("registration-token", {
      token,
      redirectTo: searchParams?.get("redirectTo") ?? "/",
    });
  });

  const isLoading =
    form.formState.isSubmitting ||
    form.formState.isSubmitSuccessful ||
    authenticateRegistration.isLoading;

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
                    placeholder={t("verificationCodePlaceholder", {
                      ns: "app",
                    })}
                    disabled={isLoading}
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
          size="lg"
          disabled={isLoading}
        >
          <Trans i18nKey="createAccount" defaults="Create Account" />
        </Button>
      </form>
    </Form>
  );
}
