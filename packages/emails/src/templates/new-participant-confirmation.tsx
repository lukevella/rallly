import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import {
  Button,
  Domain,
  Heading,
  Section,
  Text,
} from "../components/styled-components";
import type { EmailContext } from "../types";

interface NewParticipantConfirmationEmailProps {
  title: string;
  editSubmissionUrl: string;
  ctx: EmailContext;
}
export const NewParticipantConfirmationEmail = ({
  title,
  editSubmissionUrl,
  ctx,
}: NewParticipantConfirmationEmailProps) => {
  const { domain } = ctx;
  return (
    <EmailLayout
      ctx={ctx}
      preview={ctx.t("newParticipantConfirmation_preview", {
        defaultValue: "To edit your response use the link below",
        ns: "emails",
      })}
    >
      <Heading>
        {ctx.t("newParticipantConfirmation_heading", {
          defaultValue: "Poll Response Confirmation",
          ns: "emails",
        })}
      </Heading>
      <Text>
        <Trans
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="newParticipantConfirmation_content"
          defaults="Your response to <b>{{title}}</b> has been submitted."
          components={{
            b: <strong />,
          }}
          values={{ title }}
          ns="emails"
        />
      </Text>
      <Text>
        <Trans
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="newParticipantConfirmation_content2"
          defaults="While the poll is still open you can change your response using the link below."
          ns="emails"
        />
      </Text>
      <Section style={{ marginTop: 32 }}>
        <Button id="editSubmissionUrl" href={editSubmissionUrl}>
          <Trans
            i18n={ctx.i18n}
            t={ctx.t}
            i18nKey="newParticipantConfirmation_button"
            defaults="Review response on {domain}"
            values={{ domain }}
            ns="emails"
          />
        </Button>
      </Section>
      <Text light>
        <Trans
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="newParticipantConfirmation_footnote"
          defaults="You are receiving this email because a response was submitted on <domain />. If this wasn't you, please ignore this email."
          components={{
            domain: <Domain ctx={ctx} />,
          }}
          ns="emails"
        />
      </Text>
    </EmailLayout>
  );
};

NewParticipantConfirmationEmail.getSubject = (
  props: NewParticipantConfirmationEmailProps,
  ctx: EmailContext,
) => {
  return ctx.t("newParticipantConfirmation_subject", {
    defaultValue: "Thanks for responding to {{title}}",
    title: props.title,
    ns: "emails",
  });
};

export default NewParticipantConfirmationEmail;
