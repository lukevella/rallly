import { EyeIcon, MessageCircleIcon, VoteIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { FormField, FormItem } from "@rallly/ui/form";
import { Label } from "@rallly/ui/label";
import { Switch } from "@rallly/ui/switch";
import Link from "next/link";
import React from "react";
import { useFormContext } from "react-hook-form";
import { Trans } from "react-i18next";

import { ProBadge } from "@/components/pro-badge";
import { usePlan } from "@/contexts/plan";

export type PollSettingsFormData = {
  hideParticipants: boolean;
  hideScores: boolean;
  disableComments: boolean;
};

const SettingContent = ({ children }: React.PropsWithChildren) => {
  return <div className="grid grow gap-1.5 pt-0.5">{children}</div>;
};

const SettingDescription = ({ children }: React.PropsWithChildren) => {
  return <p className="text-muted-foreground text-sm">{children}</p>;
};

const SettingTitle = Label;

const Setting = ({ children }: React.PropsWithChildren) => {
  return (
    <FormItem className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-x-4">{children}</div>
    </FormItem>
  );
};

export const PollSettingsForm = ({ children }: React.PropsWithChildren) => {
  const form = useFormContext<PollSettingsFormData>();

  const plan = usePlan();

  const disabled = plan === "free";

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between gap-x-4">
          <div>
            <div className="flex items-center gap-x-2">
              <CardTitle>
                <Trans i18nKey="settings" />
              </CardTitle>
              <ProBadge />
            </div>
            <CardDescription>
              <Trans
                i18nKey="pollSettingsDescription"
                defaults="Customize the behaviour of your poll"
              />
            </CardDescription>
          </div>
          {disabled ? (
            <div>
              <Link className="text-link text-sm" href="/settings/billing">
                <Trans i18nKey="planUpgrade" />
              </Link>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "grid gap-2.5",
            disabled ? "pointer-events-none opacity-50" : "",
          )}
        >
          <FormField
            control={form.control}
            name="hideParticipants"
            render={({ field }) => (
              <Setting>
                <EyeIcon className="h-6 w-6" />
                <SettingContent>
                  <SettingTitle>
                    <Trans i18nKey="hideParticipants">
                      Hide participant list
                    </Trans>
                  </SettingTitle>
                  <SettingDescription>
                    <Trans
                      i18nKey="hideParticipantsDescription"
                      defaults="Keep participant details private"
                    />
                  </SettingDescription>
                </SettingContent>
                <Switch
                  disabled={disabled}
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                  }}
                />
              </Setting>
            )}
          />
          <FormField
            control={form.control}
            name="hideScores"
            render={({ field }) => (
              <Setting>
                <VoteIcon className="h-6 w-6" />
                <SettingContent>
                  <SettingTitle>
                    <Trans i18nKey="hideScores">Hide scores</Trans>
                  </SettingTitle>
                  <SettingDescription>
                    <Trans
                      i18nKey="hideScoresDescription"
                      defaults="Reduce bias by hiding the current vote counts from participants"
                    />
                  </SettingDescription>
                </SettingContent>
                <Switch
                  disabled={disabled}
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                  }}
                />
              </Setting>
            )}
          />
          <FormField
            control={form.control}
            name="disableComments"
            render={({ field }) => (
              <Setting>
                <MessageCircleIcon className="h-6 w-6" />
                <SettingContent>
                  <SettingTitle>
                    <Trans i18nKey="disableComments">Disable comments</Trans>
                  </SettingTitle>
                  <SettingDescription>
                    <Trans
                      i18nKey="disableCommentsDescription"
                      defaults="Remove the option to leave a comment on the poll"
                    />
                  </SettingDescription>
                </SettingContent>
                <Switch
                  disabled={disabled}
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                  }}
                />
              </Setting>
            )}
          />
        </div>
      </CardContent>
      {children}
    </Card>
  );
};
