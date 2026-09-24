"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  isActionMutationError,
  mutationOptions,
} from "@next-safe-action/adapter-tanstack-query";
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
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { validateLicenseKeyAction } from "@/features/licensing/actions";
import { Trans, useTranslation } from "@/i18n/client";
import { checkLicenseKey } from "../utils";

const formSchema = z.object({
  licenseKey: z.string().trim().min(1).refine(checkLicenseKey, {
    error: "Invalid license key",
  }),
});

export function LicenseKeyForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: {
      licenseKey: "",
    },
    resolver: zodResolver(formSchema),
  });

  const validateLicenseKey = useMutation(
    mutationOptions(validateLicenseKeyAction, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error) => {
        form.setError("licenseKey", {
          message: isActionMutationError(error)
            ? t("licenseKeyErrorInvalidLicenseKey", {
                defaultValue: "Invalid license key",
              })
            : t("licenseKeyGenericError", {
                defaultValue:
                  "An error occurred while validating the license key",
              }),
        });
      },
    }),
  );

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => {
          validateLicenseKey.mutate({ key: data.licenseKey });
        })}
      >
        <FormField
          name="licenseKey"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="licenseKey" defaults="License key" />
                </FormLabel>
                <FormControl>
                  <Input
                    className="font-mono"
                    disabled={validateLicenseKey.isPending}
                    placeholder="RLYV4-XXXX-XXXX-XXXX-XXXX-XXXX"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <div className="flex gap-2">
          <Button
            variant="primary"
            loading={validateLicenseKey.isPending}
            type="submit"
          >
            <Trans i18nKey="activate" defaults="Activate" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
