import { Section } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import { Button, Heading, Text } from "../components/styled-components";
import type { EmailContext } from "../types";

interface SpaceInviteEmailProps {
  spaceName: string;
  inviterName: string;
  spaceRole: string;
  inviteUrl: string;
  ctx: EmailContext;
}

export const SpaceInviteEmail = ({
  spaceName,
  inviterName,
  spaceRole: role,
  inviteUrl,
  ctx,
}: SpaceInviteEmailProps) => (
  <EmailLayout
    ctx={ctx}
    preview={ctx.t("spaceInvite_preview", {
      defaultValue: "You've been invited to join {spaceName}",
      spaceName,
      ns: "emails",
    })}
  >
    <Heading>
      {ctx.t("spaceInvite_heading", {
        defaultValue: "You're invited!",
        ns: "emails",
      })}
    </Heading>
    <Text>
      <Trans
        i18n={ctx.i18n}
        t={ctx.t}
        i18nKey="spaceInvite_content"
        defaults="{inviterName} has invited you to join the {spaceName} space as a {role}."
        values={{ inviterName, spaceName, role }}
        ns="emails"
      />
    </Text>
    <Section style={{ marginBottom: 16 }}>
      <Button href={inviteUrl} id="inviteUrl">
        {ctx.t("spaceInvite_button", {
          defaultValue: "Accept Invitation",
          ns: "emails",
        })}
      </Button>
    </Section>
  </EmailLayout>
);

SpaceInviteEmail.getSubject = (
  props: SpaceInviteEmailProps,
  ctx: EmailContext,
) =>
  ctx.t("spaceInvite_subject", {
    defaultValue: "You're invited to join {spaceName}",
    spaceName: props.spaceName,
    ns: "emails",
  });

export default SpaceInviteEmail;
