"use client";

import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
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
import { z } from "zod";
import { validateLicenseKey } from "../actions/validate-license";
import { checkLicenseKey } from "../helpers/check-license-key";

const formSchema = z.object({
  licenseKey: z.string().trim().min(1).refine(checkLicenseKey, {
    message: "Invalid license key",
  }),
});

type LicenseKeyFormValues = z.infer<typeof formSchema>;

export function LicenseKeyForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const form = useForm<LicenseKeyFormValues>({
    defaultValues: {
      licenseKey: "",
    },
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: LicenseKeyFormValues) => {
    try {
      const { error } = await validateLicenseKey(data.licenseKey);

      if (error) {
        switch (error) {
          case "Rate limit exceeded":
            form.setError("licenseKey", {
              message: t("licenseKeyErrorRateLimitExceeded", {
                defaultValue: "Rate limit exceeded",
              }),
            });
            break;
          case "Invalid license key":
            form.setError("licenseKey", {
              message: t("licenseKeyErrorInvalidLicenseKey", {
                defaultValue: "Invalid license key",
              }),
            });
            break;
          default:
            form.setError("licenseKey", {
              message: t("licenseKeyGenericError", {
                defaultValue:
                  "An error occurred while validating the license key",
              }),
            });
            break;
        }
        return;
      }
    } catch (error) {
      form.setError("licenseKey", {
        message: t("licenseKeyGenericError", {
          defaultValue: "An error occurred while validating the license key",
        }),
      });
    }
    router.refresh();
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          name="licenseKey"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="licenseKey" defaults="License Key" />
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
            Activate
          </Button>
        </div>
      </form>
    </Form>
  );
}
