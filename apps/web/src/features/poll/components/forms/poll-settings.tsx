"use client";

import { posthog } from "@rallly/posthog/client";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Badge } from "@rallly/ui/badge";
import { Card, CardContent, CardTitle } from "@rallly/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@rallly/ui/field";
import { FormField } from "@rallly/ui/form";
import { Switch } from "@rallly/ui/switch";
import {
  BarChart2Icon,
  InfoIcon,
  MailIcon,
  MessageCircleIcon,
  VenetianMaskIcon,
} from "lucide-react";
import { useFormContext } from "react-hook-form";
import { SettingIcon } from "@/components/setting-icon";
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
        <FieldGroup variant="divided">
          <FormField
            control={form.control}
            name="requireParticipantEmail"
            render={({ field }) => (
              <Field orientation="horizontal">
                <SettingIcon>
                  <MailIcon />
                </SettingIcon>
                <FieldContent>
                  <FieldLabel htmlFor="require-participant-email">
                    <Trans
                      i18nKey="requireParticipantEmailTitle"
                      defaults="Require email"
                    />
                    {isFree ? <ProBadge /> : null}
                  </FieldLabel>
                  <FieldDescription>
                    <Trans
                      i18nKey="requireParticipantEmailDescription"
                      defaults="Participants must provide an email address to respond."
                    />
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="require-participant-email"
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
              </Field>
            )}
          />
          <FormField
            control={form.control}
            name="hideParticipants"
            render={({ field }) => (
              <Field orientation="horizontal">
                <SettingIcon>
                  <VenetianMaskIcon />
                </SettingIcon>
                <FieldContent>
                  <FieldLabel htmlFor="hide-participants">
                    <Trans
                      i18nKey="hideParticipantsTitle"
                      defaults="Hide participant names"
                    />
                    {isFree ? <ProBadge /> : null}
                  </FieldLabel>
                  <FieldDescription>
                    <Trans
                      i18nKey="hideParticipantsDescription"
                      defaults="Participants will not be able to see the names of other respondents."
                    />
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="hide-participants"
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
              </Field>
            )}
          />
          <FormField
            control={form.control}
            name="hideScores"
            render={({ field }) => (
              <Field orientation="horizontal">
                <SettingIcon>
                  <BarChart2Icon />
                </SettingIcon>
                <FieldContent>
                  <FieldLabel htmlFor="hide-scores">
                    <Trans i18nKey="hideScoresTitle" defaults="Hide votes" />
                    {isFree ? <ProBadge /> : null}
                  </FieldLabel>
                  <FieldDescription>
                    <Trans
                      i18nKey="hideScoresDescription"
                      defaults="Hide everyone's votes from a participant until they cast their own."
                    />
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="hide-scores"
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
              </Field>
            )}
          />
          <FormField
            control={form.control}
            name="enableComments"
            render={({ field }) => (
              <div className="flex flex-col gap-3">
                <Field orientation="horizontal">
                  <SettingIcon>
                    <MessageCircleIcon />
                  </SettingIcon>
                  <FieldContent>
                    <FieldLabel htmlFor="enable-comments">
                      <Trans
                        i18nKey="commentsSettingTitle"
                        defaults="Comments"
                      />
                      <Badge size="sm">
                        <Trans
                          i18nKey="commentsSettingLegacyBadge"
                          defaults="Legacy"
                        />
                      </Badge>
                    </FieldLabel>
                    <FieldDescription>
                      <Trans
                        i18nKey="commentsSettingDescription"
                        defaults="Allow participants to post public comments on the poll."
                      />
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="enable-comments"
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      posthog?.capture("poll_settings:comments_toggle_click", {
                        enabled: checked,
                      });
                    }}
                  />
                </Field>
                {field.value ? (
                  <Alert variant="info">
                    <InfoIcon />
                    <AlertDescription>
                      <Trans
                        i18nKey="commentsSettingPhaseOutHint"
                        defaults="Comments are being phased out. Participants can include a note with their response instead."
                      />
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
            )}
          />
        </FieldGroup>
      </CardContent>
      {children}
    </Card>
  );
};
