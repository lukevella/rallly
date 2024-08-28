import { defaultEmailContext, EmailContext } from "./_components/email-context";
import { EmailLayout } from "./_components/email-layout";
import {
  Button,
  Card,
  Domain,
  Heading,
  Text,
  trackingWide,
} from "./_components/styled-components";

interface LoginEmailProps {
  name: string;
  code: string;
  magicLink: string;
  ctx: EmailContext;
}

export const LoginEmail = ({
  name = "Guest",
  code = "123456",
  magicLink = "https://rallly.co",
  ctx = defaultEmailContext,
}: LoginEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      footNote={
        <>
          Du hast diese E-Mail erhalten, da ein Login-Versuch bei{" "}
          <Domain ctx={ctx} /> stattgefunden hat. Wenn Du das nicht warst, lass
          es uns bitte wissen und antworte auf diese E-Mail.
        </>
      }
      recipientName={name}
      preview="Use this link to log in on this device."
    >
      <Text>
        um Dich in Deinen Account einzuloggen, wähle bitte eine der folgenden
        Optionen:
      </Text>
      <Card>
        <Heading>Option 1: Magischer Link</Heading>
        <Text>
          Klicke auf den magischen Link um Dich auf diesem Gerät anzumelden.
        </Text>
        <Button href={magicLink} id="magicLink">
          Logge Dich ein auf {ctx.domain}
        </Button>
        <Text light={true}>Dieser Link ist nur für 15 Minuten gültig. </Text>
      </Card>
      <Card>
        <Heading>Option 2: Verifizierungscode</Heading>
        <Text>
          Gib diesen sechsstelligen Einmal-Code für die Verifizierung ein.
        </Text>
        <Heading as="h1" style={trackingWide} id="code">
          {code}
        </Heading>
        <Text light={true}>Dieser Code ist nur für 15 Minuten gültig.</Text>
      </Card>
    </EmailLayout>
  );
};

export default LoginEmail;
