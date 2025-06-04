"use client";

import {
  SettingsGroup,
  SettingsGroupContent,
  SettingsGroupDescription,
  SettingsGroupHeader,
  SettingsGroupTitle,
} from "@/components/settings-group";
import { Trans } from "@/components/trans";
import {
  type InstanceSettings,
  instanceSettingsSchema,
} from "@/features/instance-settings/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ActionBar,
  ActionBarGroup,
  ActionBarTitle,
} from "@rallly/ui/action-bar";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { Switch } from "@rallly/ui/switch";
import { useForm } from "react-hook-form";
import { updateInstanceSettings } from "./actions";

export function InstanceSettingsForm({
  defaultValue,
}: {
  defaultValue: InstanceSettings;
}) {
  const form = useForm<InstanceSettings>({
    defaultValues: defaultValue,
    resolver: zodResolver(instanceSettingsSchema),
  });

  return (
    <Form {...form}>
      <form
        name="instance-settings-form"
        onSubmit={form.handleSubmit(async (data) => {
          await updateInstanceSettings(data);
          form.reset(data);
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
          </SettingsGroupContent>
        </SettingsGroup>
        <ActionBar open={form.formState.isDirty}>
          <ActionBarTitle>
            <p className="text-sm">You have unsaved changes</p>
          </ActionBarTitle>
          <ActionBarGroup>
            <Button
              variant="actionBar"
              type="button"
              onClick={() => form.reset()}
            >
              Cancel
            </Button>
            <Button
              loading={form.formState.isSubmitting}
              variant="primary"
              type="submit"
            >
              Save
            </Button>
          </ActionBarGroup>
        </ActionBar>
      </form>
    </Form>
  );
}
