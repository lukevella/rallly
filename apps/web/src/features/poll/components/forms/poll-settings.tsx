"use client";

import { posthog } from "@rallly/posthog/client";
import { Badge } from "@rallly/ui/badge";
import { Card, CardContent, CardTitle } from "@rallly/ui/card";
import { FormField } from "@rallly/ui/form";
import { Switch } from "@rallly/ui/switch";
import {
  BarChart2Icon,
  MailIcon,
  MessageCircleIcon,
  VenetianMaskIcon,
} from "lucide-react";
import { useFormContext } from "react-hook-form";
import {
  Setting,
  SettingControl,
  SettingDescription,
  SettingHint,
  SettingIcon,
  SettingsGroup,
  SettingTitle,
} from "@/components/setting";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import type { PollSettingsFormData } from "@/features/poll/components/forms/types";
import { Trans } from "@/i18n/client";

export const PollSettingsForm = ({ children }: React.PropsWithChildren) => {
  const form = useFormContext<PollSettingsFormData>();
  const isFree = useIsFree();

  return (
    <Card>
      <div className="px-3 pt-3 sm:px-4 sm:pt-4">
        <CardTitle>
          <Trans i18nKey="settings" />
        </CardTitle>
      </div>
      <CardContent>
        <SettingsGroup>
          <FormField
            control={form.control}
            name="requireParticipantEmail"
            render={({ field }) => (
              <Setting>
                <SettingIcon>
                  <MailIcon />
                </SettingIcon>
                <SettingTitle>
                  <Trans
                    i18nKey="requireParticipantEmailTitle"
                    defaults="Require email"
                  />
                  {isFree ? <ProBadge /> : null}
                </SettingTitle>
                <SettingDescription>
                  <Trans
                    i18nKey="requireParticipantEmailDescription"
                    defaults="Participants must provide an email address to respond."
                  />
                </SettingDescription>
                <SettingControl>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      if (checked && isFree) {
                        showPayWall({
                          from: "poll-settings",
                          setting: "requireParticipantEmail",
                        });
                      } else {
                        field.onChange(checked);
                      }
                    }}
                  />
                </SettingControl>
              </Setting>
            )}
          />
          <FormField
            control={form.control}
            name="hideParticipants"
            render={({ field }) => (
              <Setting>
                <SettingIcon>
                  <VenetianMaskIcon />
                </SettingIcon>
                <SettingTitle>
                  <Trans
                    i18nKey="hideParticipantsTitle"
                    defaults="Hide participant names"
                  />
                  {isFree ? <ProBadge /> : null}
                </SettingTitle>
                <SettingDescription>
                  <Trans
                    i18nKey="hideParticipantsDescription"
                    defaults="Participants will not be able to see the names of other respondents."
                  />
                </SettingDescription>
                <SettingControl>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      if (checked && isFree) {
                        showPayWall({
                          from: "poll-settings",
                          setting: "hideParticipants",
                        });
                      } else {
                        field.onChange(checked);
                      }
                    }}
                  />
                </SettingControl>
              </Setting>
            )}
          />
          <FormField
            control={form.control}
            name="hideScores"
            render={({ field }) => (
              <Setting>
                <SettingIcon>
                  <BarChart2Icon />
                </SettingIcon>
                <SettingTitle>
                  <Trans i18nKey="hideScoresTitle" defaults="Hide votes" />
                  {isFree ? <ProBadge /> : null}
                </SettingTitle>
                <SettingDescription>
                  <Trans
                    i18nKey="hideScoresDescription"
                    defaults="Hide everyone's votes from a participant until they cast their own."
                  />
                </SettingDescription>
                <SettingControl>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      if (checked && isFree) {
                        showPayWall({
                          from: "poll-settings",
                          setting: "hideScores",
                        });
                      } else {
                        field.onChange(checked);
                      }
                    }}
                  />
                </SettingControl>
              </Setting>
            )}
          />
          <FormField
            control={form.control}
            name="enableComments"
            render={({ field }) => (
              <Setting>
                <SettingIcon>
                  <MessageCircleIcon />
                </SettingIcon>
                <SettingTitle>
                  <Trans i18nKey="commentsSettingTitle" defaults="Comments" />
                  <Badge size="sm">
                    <Trans
                      i18nKey="commentsSettingLegacyBadge"
                      defaults="Legacy"
                    />
                  </Badge>
                </SettingTitle>
                <SettingDescription>
                  <Trans
                    i18nKey="commentsSettingDescription"
                    defaults="Allow participants to post public comments on the poll."
                  />
                </SettingDescription>
                <SettingControl>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      posthog?.capture("poll_settings:comments_toggle_click", {
                        enabled: checked,
                      });
                    }}
                  />
                </SettingControl>
                {field.value ? (
                  <SettingHint>
                    <Trans
                      i18nKey="commentsSettingPhaseOutHint"
                      defaults="Comments are being phased out. Participants can include a note with their response instead."
                    />
                  </SettingHint>
                ) : null}
              </Setting>
            )}
          />
        </SettingsGroup>
      </CardContent>
      {children}
    </Card>
  );
};
