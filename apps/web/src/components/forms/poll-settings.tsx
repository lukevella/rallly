import { usePostHog } from "@rallly/posthog/client";
import { cn } from "@rallly/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { useDialog } from "@rallly/ui/dialog";
import { FormField } from "@rallly/ui/form";
import { Switch } from "@rallly/ui/switch";
import { AtSignIcon, EyeIcon, MessageCircleIcon, VoteIcon } from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import { Trans } from "react-i18next";

import { PayWallDialog } from "@/components/pay-wall-dialog";
import { ProFeatureBadge } from "@/components/pro-feature-badge";
import { usePlan } from "@/contexts/plan";

export type PollSettingsFormData = {
  requireParticipantEmail: boolean;
  hideParticipants: boolean;
  hideScores: boolean;
  disableComments: boolean;
};

const SettingContent = ({ children }: React.PropsWithChildren) => {
  return <div className="grid grow pt-0.5">{children}</div>;
};

const SettingTitle = ({
  children,
  pro,
}: React.PropsWithChildren<{
  pro?: boolean;
  htmlFor?: string;
}>) => {
  return (
    <div className="flex min-w-0 items-center gap-x-2.5">
      <div className="text-sm font-medium">{children}</div>
      {pro ? (
        <div>
          <ProFeatureBadge />
        </div>
      ) : null}
    </div>
  );
};

const Setting = ({ children }: React.PropsWithChildren) => {
  return (
    <label
      className={cn(
        "cursor-pointer bg-white hover:bg-gray-50 active:bg-gray-100",
        "flex select-none justify-between gap-x-4 gap-y-2.5 rounded-md border p-3 sm:flex-row ",
      )}
    >
      {children}
    </label>
  );
};

export const PollSettingsForm = ({ children }: React.PropsWithChildren) => {
  const form = useFormContext<PollSettingsFormData>();
  const posthog = usePostHog();
  const paywallDialog = useDialog();
  const plan = usePlan();

  const isFree = plan === "free";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between gap-x-4">
            <div>
              <div className="flex items-center gap-x-2">
                <CardTitle>
                  <Trans i18nKey="settings" />
                </CardTitle>
              </div>
              <CardDescription>
                <Trans
                  i18nKey="pollSettingsDescription"
                  defaults="Customize the behaviour of your poll"
                />
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn("grid gap-2.5")}>
            <FormField
              control={form.control}
              name="disableComments"
              render={({ field }) => (
                <Setting>
                  <MessageCircleIcon className="size-5 shrink-0 translate-y-0.5" />
                  <SettingContent>
                    <SettingTitle htmlFor="disableComments">
                      <Trans i18nKey="disableComments">Disable Comments</Trans>
                    </SettingTitle>
                  </SettingContent>
                  <Switch
                    id={field.name}
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                    }}
                  />
                </Setting>
              )}
            />
            <FormField
              control={form.control}
              name="requireParticipantEmail"
              render={({ field }) => (
                <Setting>
                  <AtSignIcon className="size-5 shrink-0 translate-y-0.5" />
                  <SettingContent>
                    <SettingTitle pro>
                      <Trans
                        i18nKey="requireParticipantEmailLabel"
                        defaults="Make email address required for participants"
                      />
                    </SettingTitle>
                  </SettingContent>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      if (isFree) {
                        paywallDialog.trigger();
                        posthog?.capture("trigger paywall", {
                          setting: "require-participant-email",
                          from: "poll-settings",
                        });
                      } else {
                        field.onChange(checked);
                      }
                    }}
                  />
                </Setting>
              )}
            />
            <FormField
              control={form.control}
              name="hideParticipants"
              render={({ field }) => (
                <Setting>
                  <EyeIcon className="size-5 shrink-0 translate-y-0.5" />
                  <SettingContent>
                    <SettingTitle pro>
                      <Trans
                        i18nKey="hideParticipantsLabel"
                        defaults="Hide participants from each other"
                      />
                    </SettingTitle>
                  </SettingContent>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      if (isFree) {
                        paywallDialog.trigger();
                        posthog?.capture("trigger paywall", {
                          setting: "hide-participants",
                          from: "poll-settings",
                        });
                      } else {
                        field.onChange(checked);
                      }
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
                  <VoteIcon className="size-5 shrink-0 translate-y-0.5" />
                  <SettingContent>
                    <SettingTitle htmlFor={field.name} pro>
                      <Trans
                        i18nKey="hideScoresLabel"
                        defaults="Hide scores until after a participant has voted"
                      />
                    </SettingTitle>
                  </SettingContent>
                  <Switch
                    id={field.name}
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      if (isFree) {
                        paywallDialog.trigger();
                        posthog?.capture("trigger paywall", {
                          setting: "hide-scores",
                          from: "poll-settings",
                        });
                      } else {
                        field.onChange(checked);
                      }
                    }}
                  />
                </Setting>
              )}
            />
          </div>
        </CardContent>
        {children}
      </Card>
      <PayWallDialog {...paywallDialog.dialogProps} />
    </>
  );
};
