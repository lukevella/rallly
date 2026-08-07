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
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { validateLicenseKeyAction } from "@/features/licensing/actions";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { checkLicenseKey } from "../utils";

const formSchema = z.object({
  licenseKey: z.string().trim().min(1).refine(checkLicenseKey, {
    error: "Invalid license key",
  }),
});

export function LicenseKeyForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      licenseKey: "",
    },
    resolver: zodResolver(formSchema),
  });

  const validateLicenseKey = useSafeAction(validateLicenseKeyAction);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (data) => {
          try {
            const result = await validateLicenseKey.executeAsync({
              key: data.licenseKey,
            });

            if (!result.data) {
              form.setError("licenseKey", {
                message: t("licenseKeyErrorInvalidLicenseKey", {
                  defaultValue: "Invalid license key",
                }),
              });
              return;
            }
          } catch (_error) {
            form.setError("licenseKey", {
              message: t("licenseKeyGenericError", {
                defaultValue:
                  "An error occurred while validating the license key",
              }),
            });
            return;
          }

          // Refreshing swaps the page to the installed-license branch, which
          // unmounts this form. Notify the owner first so closing the dialog
          // doesn't depend on that re-render winning a race.
          onSuccess?.();
          router.refresh();
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
                    disabled={form.formState.isSubmitting}
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
            loading={form.formState.isSubmitting}
            type="submit"
          >
            <Trans i18nKey="activate" defaults="Activate" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
