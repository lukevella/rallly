import {
  AtSignIcon,
  EyeIcon,
  InfoIcon,
  MessageCircleIcon,
  VoteIcon,
} from "@rallly/icons";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import React from "react";
import { useFormContext } from "react-hook-form";
import { Trans } from "react-i18next";

import { ProBadge } from "@/components/pro-badge";
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

const SettingDescription = ({ children }: React.PropsWithChildren) => {
  return (
    <p className="text-muted-foreground text-sm leading-relaxed">{children}</p>
  );
};

const SettingTitle = ({
  children,
  htmlFor,
  pro,
  hint,
}: React.PropsWithChildren<{
  pro?: boolean;
  htmlFor?: string;
  hint?: React.ReactNode;
}>) => {
  return (
    <div className="flex h-7 min-w-0 items-center gap-x-2.5">
      <Label htmlFor={htmlFor} className="truncate">
        {children}
      </Label>
      {pro ? <ProBadge /> : null}
      {hint ? (
        <Tooltip>
          <TooltipTrigger>
            <InfoIcon className="text-muted-foreground h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
};

const Setting = ({ children }: React.PropsWithChildren) => {
  return (
    <FormItem className="rounded-lg border px-4 py-3">
      <div className="flex items-start justify-between gap-x-4">{children}</div>
    </FormItem>
  );
};

export const PollSettingsForm = ({ children }: React.PropsWithChildren) => {
  const form = useFormContext<PollSettingsFormData>();

  const plan = usePlan();

  const isFree = plan === "free";

  return (
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
            name="requireParticipantEmail"
            render={({ field }) => (
              <Setting>
                <AtSignIcon className="text-muted-foreground h-6 w-6 shrink-0 translate-y-1" />
                <SettingContent>
                  <SettingTitle pro>
                    <Trans
                      i18nKey="requireParticipantEmail"
                      defaults="Make Email Required"
                    />
                  </SettingTitle>
                  <SettingDescription>
                    <Trans
                      i18nKey="requireParticipantEmailDescription"
                      defaults="Participants must provide an email address to vote"
                    />
                  </SettingDescription>
                </SettingContent>
                <Switch
                  disabled={isFree}
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
            name="hideParticipants"
            render={({ field }) => (
              <Setting>
                <EyeIcon className="text-muted-foreground h-6 w-6 shrink-0 translate-y-1" />
                <SettingContent>
                  <SettingTitle pro>
                    <Trans i18nKey="hideParticipants">
                      Hide Participant List
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
                  disabled={isFree}
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
                <VoteIcon className="text-muted-foreground h-6 w-6 shrink-0 translate-y-1" />
                <SettingContent>
                  <SettingTitle htmlFor={field.name} pro>
                    <Trans i18nKey="hideScores">Hide Scores</Trans>
                  </SettingTitle>
                  <SettingDescription>
                    <Trans
                      i18nKey="hideScoresDescription"
                      defaults="Reduce bias by hiding the current vote counts from participants"
                    />
                  </SettingDescription>
                </SettingContent>
                <Switch
                  id={field.name}
                  disabled={isFree}
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
                <MessageCircleIcon className="text-muted-foreground h-6 w-6 shrink-0 translate-y-1" />
                <SettingContent>
                  <SettingTitle htmlFor="disableComments">
                    <Trans i18nKey="disableComments">Disable Comments</Trans>
                  </SettingTitle>
                  <SettingDescription>
                    <Trans
                      i18nKey="disableCommentsDescription"
                      defaults="Remove the option to leave a comment on the poll"
                    />
                  </SettingDescription>
                </SettingContent>
                <Switch
                  id={field.name}
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
