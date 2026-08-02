"use client";

import { posthog } from "@rallly/posthog/client";
import { Badge } from "@rallly/ui/badge";
import { Card, CardContent, CardTitle } from "@rallly/ui/card";
import { FormField } from "@rallly/ui/form";
import { Switch } from "@rallly/ui/switch";
import {
  BarChart2Icon,
  InfoIcon,
  MailIcon,
  MessageCircleIcon,
  VenetianMaskIcon,
} from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import { PageIcon } from "@/components/page-icons";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import type { PollSettingsFormData } from "@/features/poll/components/forms/types";
import { Trans } from "@/i18n/client";

const PollSettingContext = React.createContext<{
  titleId: string;
  descriptionId: string;
  hintId: string;
} | null>(null);

const usePollSetting = () => {
  const context = React.useContext(PollSettingContext);
  if (!context) {
    throw new Error("PollSetting components must be used within <PollSetting>");
  }
  return context;
};

const PollSetting = ({ children }: React.PropsWithChildren) => {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const hintId = React.useId();
  const value = React.useMemo(
    () => ({ titleId, descriptionId, hintId }),
    [titleId, descriptionId, hintId],
  );

  return (
    <PollSettingContext.Provider value={value}>
      {/* biome-ignore lint/a11y/noLabelWithoutControl: switch is rendered inside */}
      <label className="grid cursor-pointer select-none grid-cols-[1fr_auto] gap-x-3 py-4 [grid-template-areas:'title_control'_'description_control'_'hint_hint'] first:pt-0 last:pb-0 sm:grid-cols-[auto_1fr_auto] sm:[grid-template-areas:'icon_title_control'_'icon_description_control'_'icon_hint_hint']">
        {children}
      </label>
    </PollSettingContext.Provider>
  );
};

const PollSettingIcon = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="hidden self-start [grid-area:icon] sm:block">
      <PageIcon size="lg">{children}</PageIcon>
    </div>
  );
};

const PollSettingTitle = ({ children }: React.PropsWithChildren) => {
  const { titleId } = usePollSetting();
  return (
    <div
      id={titleId}
      className="flex items-center gap-x-2 text-sm [grid-area:title]"
    >
      {children}
    </div>
  );
};

const PollSettingDescription = ({ children }: React.PropsWithChildren) => {
  const { descriptionId } = usePollSetting();
  return (
    <div
      id={descriptionId}
      className="mt-0.5 text-muted-foreground text-xs [grid-area:description]"
    >
      {children}
    </div>
  );
};

const PollSettingControl = ({
  children,
}: {
  children: React.ReactElement<{
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
  }>;
}) => {
  const { titleId, descriptionId, hintId } = usePollSetting();
  return (
    <div className="self-start justify-self-end [grid-area:control]">
      {/* A dangling hint id is ignored by assistive tech while no hint is rendered */}
      {React.cloneElement(children, {
        "aria-labelledby": titleId,
        "aria-describedby": `${descriptionId} ${hintId}`,
      })}
    </div>
  );
};

const PollSettingHint = ({ children }: React.PropsWithChildren) => {
  const { hintId } = usePollSetting();
  return (
    <div
      id={hintId}
      className="mt-4 flex items-start gap-x-1.5 text-muted-foreground text-xs [grid-area:hint]"
    >
      <InfoIcon className="size-3.5 shrink-0 translate-y-px" />
      <span>{children}</span>
    </div>
  );
};

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
        <div className="divide-y">
          <FormField
            control={form.control}
            name="requireParticipantEmail"
            render={({ field }) => (
              <PollSetting>
                <PollSettingIcon>
                  <MailIcon />
                </PollSettingIcon>
                <PollSettingTitle>
                  <Trans
                    i18nKey="requireParticipantEmailTitle"
                    defaults="Require email"
                  />
                  {isFree ? <ProBadge /> : null}
                </PollSettingTitle>
                <PollSettingDescription>
                  <Trans
                    i18nKey="requireParticipantEmailDescription"
                    defaults="Participants must provide an email address to respond."
                  />
                </PollSettingDescription>
                <PollSettingControl>
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
                </PollSettingControl>
              </PollSetting>
            )}
          />
          <FormField
            control={form.control}
            name="hideParticipants"
            render={({ field }) => (
              <PollSetting>
                <PollSettingIcon>
                  <VenetianMaskIcon />
                </PollSettingIcon>
                <PollSettingTitle>
                  <Trans
                    i18nKey="hideParticipantsTitle"
                    defaults="Hide participant names"
                  />
                  {isFree ? <ProBadge /> : null}
                </PollSettingTitle>
                <PollSettingDescription>
                  <Trans
                    i18nKey="hideParticipantsDescription"
                    defaults="Participants will not be able to see the names of other respondents."
                  />
                </PollSettingDescription>
                <PollSettingControl>
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
                </PollSettingControl>
              </PollSetting>
            )}
          />
          <FormField
            control={form.control}
            name="hideScores"
            render={({ field }) => (
              <PollSetting>
                <PollSettingIcon>
                  <BarChart2Icon />
                </PollSettingIcon>
                <PollSettingTitle>
                  <Trans i18nKey="hideScoresTitle" defaults="Hide votes" />
                  {isFree ? <ProBadge /> : null}
                </PollSettingTitle>
                <PollSettingDescription>
                  <Trans
                    i18nKey="hideScoresDescription"
                    defaults="Hide everyone's votes from a participant until they cast their own."
                  />
                </PollSettingDescription>
                <PollSettingControl>
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
                </PollSettingControl>
              </PollSetting>
            )}
          />
          <FormField
            control={form.control}
            name="enableComments"
            render={({ field }) => (
              <PollSetting>
                <PollSettingIcon>
                  <MessageCircleIcon />
                </PollSettingIcon>
                <PollSettingTitle>
                  <Trans i18nKey="commentsSettingTitle" defaults="Comments" />
                  <Badge size="sm">
                    <Trans
                      i18nKey="commentsSettingLegacyBadge"
                      defaults="Legacy"
                    />
                  </Badge>
                </PollSettingTitle>
                <PollSettingDescription>
                  <Trans
                    i18nKey="commentsSettingDescription"
                    defaults="Allow participants to post comments on the poll."
                  />
                </PollSettingDescription>
                <PollSettingControl>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      posthog?.capture("poll_settings:comments_toggle_click", {
                        enabled: checked,
                      });
                    }}
                  />
                </PollSettingControl>
                {field.value ? (
                  <PollSettingHint>
                    <Trans
                      i18nKey="commentsSettingPhaseOutHint"
                      defaults="Comments are being phased out. Participants can include a note with their response instead."
                    />
                  </PollSettingHint>
                ) : null}
              </PollSetting>
            )}
          />
        </div>
      </CardContent>
      {children}
    </Card>
  );
};
