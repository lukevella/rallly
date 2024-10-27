"use client";

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
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useTranslation } from "@/app/i18n/client";
import { Trans } from "@/components/trans";

import { useDayjs } from "@/utils/dayjs";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";
import { signIn } from "next-auth/react";
import { InputOTP } from "./input-otp";

const otpFormSchema = z.object({
  otp: z.string().length(6),
});

type OTPFormValues = z.infer<typeof otpFormSchema>;

export function OTPForm({ token }: { token: string }) {
  const { i18n } = useTranslation();
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
      callbackUrl: searchParams?.get("callbackUrl") ?? undefined,
    });
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
                <FormLabel>
                  <Trans ns="app" i18nKey="enterCode" defaults="6-digit code" />
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
        <Button
          className="w-full"
          variant="primary"
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          <Trans i18nKey="continue" defaults="Continue" />
        </Button>
      </form>
    </Form>
  );
}
