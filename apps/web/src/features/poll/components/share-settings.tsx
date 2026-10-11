"use client";

import { posthog } from "@rallly/posthog/client";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@rallly/ui/field";
import { Switch } from "@rallly/ui/switch";
import {
  BarChart2Icon,
  MailIcon,
  MessageCircleIcon,
  VenetianMaskIcon,
} from "lucide-react";
import React from "react";
import { SettingIcon } from "@/components/setting-icon";
import { usePoll } from "@/features/poll/client";
import { useUpdatePollMutation } from "@/features/poll/components/mutations";
import { Trans } from "@/i18n/client";

type ShareSetting =
  | "requireParticipantEmail"
  | "hideParticipants"
  | "hideScores"
  | "enableComments";

function SettingRow({
  id,
  icon,
  title,
  description,
  value,
  onChange,
}: {
  id: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  value: boolean;
  onChange: (checked: boolean) => Promise<unknown>;
}) {
  // Shown until the post-save router refresh delivers the poll with the new
  // value; reverts by itself if the save fails.
  const [optimisticValue, setOptimisticValue] = React.useOptimistic(value);

  return (
    <Field orientation="horizontal">
      <SettingIcon>{icon}</SettingIcon>
      <FieldContent>
        <FieldLabel htmlFor={id}>{title}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <Switch
        id={id}
        checked={optimisticValue}
        onCheckedChange={(checked) => {
          React.startTransition(async () => {
            setOptimisticValue(checked);
            try {
              await onChange(checked);
            } catch {
              // The optimistic value reverts; the tRPC client reports the error.
            }
          });
        }}
      />
    </Field>
  );
}

/**
 * The poll's sharing settings, saved as each switch is flipped. The same
 * rows as the settings form, worded from the organiser's side: what she
 * gets, not what participants must do. Rendered as rows, not a card, so
 * they sit inside the share card under its heading: look at these first,
 * then send.
 */
export function SharePollSettings({
  fields = [
    "requireParticipantEmail",
    "hideParticipants",
    "hideScores",
    "enableComments",
  ],
}: {
  fields?: ShareSetting[];
}) {
  const poll = usePoll();
  const update = useUpdatePollMutation();

  const save = (
    setting: ShareSetting,
    enabled: boolean,
    data: {
      requireParticipantEmail?: boolean;
      hideParticipants?: boolean;
      hideScores?: boolean;
      disableComments?: boolean;
    },
  ) => {
    posthog?.capture("poll_share:setting_toggle", {
      poll_id: poll.id,
      setting,
      enabled,
    });
    return update.mutateAsync({ pollId: poll.id, ...data });
  };

  const rows: Record<ShareSetting, React.ReactNode> = {
    requireParticipantEmail: (
      <SettingRow
        key="requireParticipantEmail"
        id="share-require-participant-email"
        icon={<MailIcon />}
        title={
          <Trans
            i18nKey="requireParticipantEmailTitle"
            defaults="Require email"
          />
        }
        description={
          <Trans
            i18nKey="shareRequireEmailDescription"
            defaults="Ask for an email, so everyone gets the calendar invite when you pick the date."
          />
        }
        value={poll.requireParticipantEmail}
        onChange={(checked) =>
          save("requireParticipantEmail", checked, {
            requireParticipantEmail: checked,
          })
        }
      />
    ),
    hideParticipants: (
      <SettingRow
        key="hideParticipants"
        id="share-hide-participants"
        icon={<VenetianMaskIcon />}
        title={
          <Trans
            i18nKey="hideParticipantsTitle"
            defaults="Hide participant names"
          />
        }
        description={
          <Trans
            i18nKey="shareHideParticipantsDescription"
            defaults="Keep participants from seeing each other's names. Useful when two of them compete."
          />
        }
        value={poll.hideParticipants}
        onChange={(checked) =>
          save("hideParticipants", checked, { hideParticipants: checked })
        }
      />
    ),
    hideScores: (
      <SettingRow
        key="hideScores"
        id="share-hide-scores"
        icon={<BarChart2Icon />}
        title={<Trans i18nKey="hideScoresTitle" defaults="Hide votes" />}
        description={
          <Trans
            i18nKey="shareHideScoresDescription"
            defaults="Hide everyone's votes from a participant until they have answered."
          />
        }
        value={poll.hideScores}
        onChange={(checked) =>
          save("hideScores", checked, { hideScores: checked })
        }
      />
    ),
    enableComments: (
      <SettingRow
        key="enableComments"
        id="share-enable-comments"
        icon={<MessageCircleIcon />}
        title={<Trans i18nKey="commentsSettingTitle" defaults="Comments" />}
        description={
          <Trans
            i18nKey="shareCommentsDescription"
            defaults="Participants can leave a comment under the poll."
          />
        }
        value={!poll.disableComments}
        onChange={(checked) =>
          save("enableComments", checked, { disableComments: !checked })
        }
      />
    ),
  };

  return (
    <FieldGroup variant="divided">
      {fields.map((field) => rows[field])}
    </FieldGroup>
  );
}
