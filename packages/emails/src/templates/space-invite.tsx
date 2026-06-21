import { Head, Hr, Html, Img, Preview } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { resolveChrome } from "../chrome";
import { PoweredBy } from "../components/powered-by";
import { previewChrome } from "../components/preview-chrome";
import {
  Body,
  Button,
  Container,
  Heading,
  Text,
} from "../components/styled-components";
import { createEmailI18n } from "../i18n";
import type { SendArgs } from "../send";
import { sendRenderedEmail } from "../send";
import type { EmailChrome } from "../types";

type SpaceInviteEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  spaceName: string;
  inviterName: string;
  spaceRole: string;
  inviteUrl: string;
};

async function SpaceInviteEmail({
  spaceName,
  inviterName,
  spaceRole: role,
  inviteUrl,
  locale = "en",
  chrome,
}: SpaceInviteEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("spaceInvite_preview", {
          defaultValue: "You've been invited to join {spaceName}",
          spaceName,
        })}
      </Preview>
      <Body>
        <Container>
          <Img
            src={chrome.logoUrl}
            height="42"
            style={{ marginBottom: 32, borderRadius: 6 }}
            alt={chrome.appName}
          />
          <Heading>
            {t("spaceInvite_heading", {
              defaultValue: "You're invited!",
            })}
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="spaceInvite_content"
              defaults="{inviterName} has invited you to join the {spaceName} space as a {role}."
              values={{ inviterName, spaceName, role }}
            />
          </Text>
          <Button href={inviteUrl} id="inviteUrl" color={chrome.primaryColor}>
            {t("spaceInvite_button", {
              defaultValue: "Accept Invitation",
            })}
          </Button>
          <Hr style={{ margin: "16px 0" }} />
          <PoweredBy chrome={chrome} locale={locale} />
        </Container>
      </Body>
    </Html>
  );
}

SpaceInviteEmail.PreviewProps = {
  spaceName: "Marketing Team",
  inviterName: "John Smith",
  spaceRole: "member",
  inviteUrl: "https://rallly.co/invite/abc123",
  locale: "en",
  chrome: previewChrome,
} as SpaceInviteEmailProps;

export default SpaceInviteEmail;

export async function sendSpaceInviteEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<SpaceInviteEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("spaceInvite_subject", {
      defaultValue: "You're invited to join {spaceName}",
      spaceName: props.spaceName,
    }),
    element: (
      <SpaceInviteEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
