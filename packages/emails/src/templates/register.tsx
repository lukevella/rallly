import { defaultEmailContext, EmailContext } from "./_components/email-context";
import { EmailLayout } from "./_components/email-layout";
import {
  Domain,
  Heading,
  Text,
  trackingWide,
} from "./_components/styled-components";

interface RegisterEmailProps {
  code: string;
  ctx: EmailContext;
}

export const RegisterEmail = ({
  code = "123456",
  ctx = defaultEmailContext,
}: RegisterEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      footNote={
        <>
          Du erhältst diese E-Mail, da eine Registrierungsanfrage auf{" "}
          <Domain ctx={ctx} /> eingegangen ist. Wenn Du das nicht warst,
          ignoriere bitte diese E-Mail.
        </>
      }
      preview={`Your 6-digit code is: ${code}`}
    >
      <Text>
        Bitte nutze folgenden sechsstelligen Code um Deine E-Mailadresse zu
        verifizieren:
      </Text>
      <Heading as="h1" style={{ ...trackingWide }} id="code">
        {code}
      </Heading>
      <Text>Dieser Code ist nur für 15 Minuten gültig.</Text>
    </EmailLayout>
  );
};

export default RegisterEmail;
