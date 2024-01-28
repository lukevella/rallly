import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Tailwind,
} from "@react-email/components";

import { EmailContext } from "./email-context";
import { Section, Text } from "./styled-components";

export interface EmailLayoutProps {
  preview: string;
  recipientName: string;
  footNote?: React.ReactNode;
  ctx: EmailContext;
}

const sectionStyles = {
  marginTop: "16px",
  marginBottom: "16px",
};

export const EmailLayout = ({
  preview,
  recipientName = "Guest",
  children,
  footNote,
  ctx,
}: React.PropsWithChildren<EmailLayoutProps>) => {
  const { logoUrl, baseUrl } = ctx;
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>{preview}</Preview>
        <Body className="bg-gray-50 py-5">
          <Container className="w-full rounded-md border border-solid border-gray-200 bg-white p-4">
            <Img src={logoUrl} alt="Rallly" width={128} />
            <Section style={sectionStyles}>
              <Text>Hi {recipientName},</Text>
              {children}
            </Section>
            {footNote ? (
              <Section className="border-t border-solid border-gray-200">
                <Text className="text-sm text-gray-500">{footNote}</Text>
              </Section>
            ) : null}
            <Section className="my-0 font-sans text-sm text-gray-500">
              <Link className="text-gray-500" href={baseUrl}>
                Home
              </Link>
              <span>&nbsp;&bull;&nbsp;</span>
              <Link
                className="text-gray-500"
                href="https://twitter.com/ralllyco"
              >
                Twitter
              </Link>
              <span>&nbsp;&bull;&nbsp;</span>
              <Link
                className="text-gray-500"
                href="https://github.com/lukevella/rallly"
              >
                Github
              </Link>
              <span>&nbsp;&bull;&nbsp;</span>
              <Link
                className="text-gray-500"
                href="https://www.paypal.com/donate/?hosted_button_id=7QXP2CUBLY88E"
              >
                Donate
              </Link>
              <span>&nbsp;&bull;&nbsp;</span>
              <Link
                className="text-gray-500"
                href={`mailto:${process.env["SUPPORT_EMAIL"]}`}
              >
                Contact
              </Link>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};
