import { posthog } from "@rallly/posthog/client";
import { Badge } from "@rallly/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { FormField } from "@rallly/ui/form";
import { Switch } from "@rallly/ui/switch";
import {
  AtSignIcon,
  EyeIcon,
  InfoIcon,
  MessageCircleIcon,
  VoteIcon,
} from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import type { PollSettingsFormData } from "@/features/poll/components/forms/types";
import { Trans } from "@/i18n/client";

const PollSetting = ({
  name,
  icon: Icon,
  pro = false,
  title,
  description,
}: {
  name: keyof PollSettingsFormData;
  icon: React.ComponentType<{ className?: string }>;
  pro?: boolean;
  title: React.ReactNode;
  description: React.ReactNode;
}) => {
  const form = useFormContext<PollSettingsFormData>();
  const isFree = useIsFree();
  const titleId = React.useId();
  const descriptionId = React.useId();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        // biome-ignore lint/a11y/noLabelWithoutControl: switch is rendered inside
        <label className="flex cursor-pointer select-none items-start gap-x-3 rounded-xl border bg-card p-3 hover:bg-card-accent">
          <Icon className="size-4 shrink-0 translate-y-0.5 text-muted-foreground" />
          <div className="grow">
            <div
              id={titleId}
              className="flex items-center gap-x-2 font-medium text-sm"
            >
              {title}
              {pro && isFree ? <ProBadge /> : null}
            </div>
            <div
              id={descriptionId}
              className="mt-1 text-muted-foreground text-xs"
            >
              {description}
            </div>
          </div>
          <Switch
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            checked={!!field.value}
            onCheckedChange={(checked) => {
              if (checked && pro && isFree) {
                showPayWall({ from: "poll-settings", setting: name });
              } else {
                field.onChange(checked);
              }
            }}
          />
        </label>
      )}
    />
  );
};

const CommentsSetting = () => {
  const form = useFormContext<PollSettingsFormData>();
  const titleId = React.useId();
  const descriptionId = React.useId();
  const hintId = React.useId();

  return (
    <FormField
      control={form.control}
      name="enableComments"
      render={({ field }) => (
        // biome-ignore lint/a11y/noLabelWithoutControl: switch is rendered inside
        <label className="flex cursor-pointer select-none items-start gap-x-3 rounded-xl border bg-card p-3 hover:bg-card-accent">
          <MessageCircleIcon className="size-4 shrink-0 translate-y-0.5 text-muted-foreground" />
          <div className="grow">
            <div
              id={titleId}
              className="flex items-center gap-x-2 font-medium text-sm"
            >
              <Trans i18nKey="commentsSettingTitle" defaults="Comments" />
              <Badge size="sm">
                <Trans i18nKey="commentsSettingLegacyBadge" defaults="Legacy" />
              </Badge>
            </div>
            <div
              id={descriptionId}
              className="mt-1 text-muted-foreground text-xs"
            >
              <Trans
                i18nKey="commentsSettingDescription"
                defaults="Let participants post public comments on the poll."
              />
            </div>
            {field.value ? (
              <div
                id={hintId}
                className="mt-2 flex items-start gap-x-1.5 text-muted-foreground text-xs"
              >
                <InfoIcon className="size-3.5 shrink-0 translate-y-px" />
                <span>
                  <Trans
                    i18nKey="commentsSettingPhaseOutHint"
                    defaults="Comments are being phased out. Participants can include a note with their response instead."
                  />
                </span>
              </div>
            ) : null}
          </div>
          <Switch
            aria-labelledby={titleId}
            aria-describedby={
              field.value ? `${descriptionId} ${hintId}` : descriptionId
            }
            checked={!!field.value}
            onCheckedChange={(checked) => {
              field.onChange(checked);
              posthog?.capture("poll_settings:comments_toggle_click", {
                enabled: checked,
              });
            }}
          />
        </label>
      )}
    />
  );
};

export const PollSettingsForm = ({ children }: React.PropsWithChildren) => {
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
        <div className="grid gap-2.5">
          <PollSetting
            name="requireParticipantEmail"
            icon={AtSignIcon}
            pro
            title={
              <Trans
                i18nKey="requireParticipantEmailTitle"
                defaults="Require email"
              />
            }
            description={
              <Trans
                i18nKey="requireParticipantEmailDescription"
                defaults="Participants must provide an email address to respond."
              />
            }
          />
          <PollSetting
            name="hideParticipants"
            icon={EyeIcon}
            pro
            title={
              <Trans
                i18nKey="hideParticipantsTitle"
                defaults="Hide participant names"
              />
            }
            description={
              <Trans
                i18nKey="hideParticipantsDescription"
                defaults="Participants will not be able to see the names of other respondents."
              />
            }
          />
          <PollSetting
            name="hideScores"
            icon={VoteIcon}
            pro
            title={<Trans i18nKey="hideScoresTitle" defaults="Hide votes" />}
            description={
              <Trans
                i18nKey="hideScoresDescription"
                defaults="Hide everyone's votes from a participant until they cast their own."
              />
            }
          />
          <CommentsSetting />
        </div>
      </CardContent>
      {children}
    </Card>
  );
};
