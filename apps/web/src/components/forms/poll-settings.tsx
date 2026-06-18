import { posthog } from "@rallly/posthog/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { FormField } from "@rallly/ui/form";
import { Switch } from "@rallly/ui/switch";
import { AtSignIcon, EyeIcon, MessageCircleIcon, VoteIcon } from "lucide-react";
import type React from "react";
import { useFormContext } from "react-hook-form";
import { ProBadge } from "@/components/pro-badge";
import { useIsFree } from "@/features/billing/client";
import { showPayWall } from "@/features/billing/paywall-store";
import { Trans } from "@/i18n/client";

export type PollSettingsFormData = {
  requireParticipantEmail: boolean;
  hideParticipants: boolean;
  hideScores: boolean;
  disableComments: boolean;
};

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

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        // biome-ignore lint/a11y/noLabelWithoutControl: switch is rendered inside
        <label className="flex cursor-pointer select-none items-start gap-x-3 rounded-xl border bg-card p-3 hover:bg-card-accent">
          <Icon className="size-4 shrink-0 translate-y-0.5 text-muted-foreground" />
          <div className="grow">
            <div className="flex items-center gap-x-2 font-medium text-sm">
              {title}
              {pro && isFree ? <ProBadge /> : null}
            </div>
            <div className="mt-1 text-muted-foreground text-xs">
              {description}
            </div>
          </div>
          <Switch
            checked={!!field.value}
            onCheckedChange={(checked) => {
              if (checked && pro && isFree) {
                showPayWall();
                posthog?.capture("trigger paywall", {
                  setting: name,
                  from: "poll-settings",
                });
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
            name="disableComments"
            icon={MessageCircleIcon}
            title={
              <Trans
                i18nKey="disableCommentsTitle"
                defaults="Disable comments"
              />
            }
            description={
              <Trans
                i18nKey="disableCommentsDescription"
                defaults="Remove the option to leave comments on the poll."
              />
            }
          />
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
        </div>
      </CardContent>
      {children}
    </Card>
  );
};
