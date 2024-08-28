import { defaultEmailContext, EmailContext } from "./_components/email-context";
import { EmailLayout } from "./_components/email-layout";
import { Button, Domain, Section, Text } from "./_components/styled-components";

interface NewParticipantConfirmationEmailProps {
  name: string;
  title: string;
  editSubmissionUrl: string;
  ctx: EmailContext;
}
export const NewParticipantConfirmationEmail = ({
  title = "Untitled Poll",
  name = "John",
  editSubmissionUrl = "https://rallly.co",
  ctx = defaultEmailContext,
}: NewParticipantConfirmationEmailProps) => {
  const { domain } = ctx;
  return (
    <EmailLayout
      ctx={ctx}
      footNote={
        <>
          Du erhältst diese E-Mail, da eine Antwort auf <Domain ctx={ctx} />{" "}
          eingegangen ist. Wenn Du das nicht warst, ignoriere bitte diese
          E-Mail.
        </>
      }
      recipientName={name}
      preview="To edit your response use the link below"
    >
      <Text>
        Deine Antwort auf <strong>{title}</strong> wurde erfolgreich
        übermittelt.
      </Text>
      <Text>
        Solange die Umfrage noch läuft, kannst Du Deine Antwort über den
        folgenden Link ändern oder anschauen:
      </Text>
      <Section>
        <Button id="editSubmissionUrl" href={editSubmissionUrl}>
          Ansehen auf {domain}
        </Button>
      </Section>
    </EmailLayout>
  );
};

export default NewParticipantConfirmationEmail;
