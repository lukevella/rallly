"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ActionBar,
  ActionBarGroup,
  ActionBarTitle,
} from "@rallly/ui/action-bar";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import { ContainerIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  SettingsGroup,
  SettingsGroupContent,
  SettingsGroupDescription,
  SettingsGroupHeader,
  SettingsGroupTitle,
} from "@/components/settings-group";
import { Trans } from "@/components/trans";
import type { InstanceSettings } from "@/features/instance-settings/schema";
import { instanceSettingsSchema } from "@/features/instance-settings/schema";
import { useTranslation } from "@/i18n/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { updateInstanceSettingsAction } from "./actions";

export function InstanceSettingsForm({
  defaultValue,
}: {
  defaultValue: InstanceSettings;
}) {
  const isRegistrationEnabled = useFeatureFlag("registration");

  const form = useForm<InstanceSettings>({
    defaultValues: {
      ...defaultValue,
      disableUserRegistration:
        !isRegistrationEnabled || Boolean(defaultValue.disableUserRegistration),
    },
    resolver: zodResolver(instanceSettingsSchema),
  });

  const updateInstanceSettings = useSafeAction(updateInstanceSettingsAction);

  const { t } = useTranslation();

  return (
    <Form {...form}>
      <form
        name="instance-settings-form"
        onSubmit={form.handleSubmit(async (data) => {
          try {
            await updateInstanceSettings.executeAsync(data);
            form.reset(data);
          } catch (error) {
            console.error(error);
            toast.error(
              t("unexpectedError", {
                defaultValue: "Unexpected Error",
              }),
              {
                description: t("unexpectedErrorDescription", {
                  defaultValue:
                    "There was an unexpected error. Please try again later.",
                }),
              },
            );
          }
        })}
      >
        <SettingsGroup>
          <SettingsGroupHeader>
            <SettingsGroupTitle>
              <Trans
                i18nKey="authenticationAndSecurity"
                defaults="Authentication & Security"
              />
            </SettingsGroupTitle>
            <SettingsGroupDescription>
              <Trans
                i18nKey="authenticationAndSecurityDescription"
                defaults="Manage authentication and security settings"
              />
            </SettingsGroupDescription>
          </SettingsGroupHeader>
          <SettingsGroupContent>
            <FormField
              control={form.control}
              name="disableUserRegistration"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        onCheckedChange={field.onChange}
                        checked={field.value}
                        disabled={!isRegistrationEnabled}
                      />
                    </FormControl>
                    <FormLabel>
                      <Trans
                        i18nKey="disableUserRegistration"
                        defaults="Disable User Registration"
                      />
                    </FormLabel>
                  </div>
                  <FormDescription>
                    <Trans
                      i18nKey="disableUserRegistrationDescription"
                      defaults="Prevent new users from registering an account."
                    />
                  </FormDescription>
                </FormItem>
              )}
            />
            {!isRegistrationEnabled && (
              <Alert variant="note" className="mt-4">
                <ContainerIcon />
                <AlertDescription>
                  <p>
                    <Trans
                      i18nKey="configuredByEnvironmentVariable"
                      defaults="This setting has been configured by environment variable."
                    />
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </SettingsGroupContent>
        </SettingsGroup>
        <ActionBar open={form.formState.isDirty}>
          <ActionBarTitle>
            <Trans
              i18nKey="youHaveUnsavedChanges"
              defaults="You have unsaved changes"
            />
          </ActionBarTitle>
          <ActionBarGroup>
            <Button
              variant="actionBar"
              type="button"
              onClick={() => form.reset()}
            >
              <Trans i18nKey="cancel" defaults="Cancel" />
            </Button>
            <Button
              loading={form.formState.isSubmitting}
              variant="primary"
              type="submit"
            >
              <Trans i18nKey="save" defaults="Save" />
            </Button>
          </ActionBarGroup>
        </ActionBar>
      </form>
    </Form>
  );
}
