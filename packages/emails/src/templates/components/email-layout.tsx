import tailwindConfig from "@rallly/tailwind-config";
import { absoluteUrl } from "@rallly/utils";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

import { SmallText, Text } from "./styled-components";

interface EmailLayoutProps {
  preview: string;
  recipientName: string;
  footNote?: React.ReactNode;
}

export const EmailLayout = ({
  preview,
  recipientName = "Guest",
  children,
  footNote,
}: React.PropsWithChildren<EmailLayoutProps>) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              ...tailwindConfig.theme.extend,
              spacing: {
                screen: "100vw",
                full: "100%",
                px: "1px",
                0: "0",
                0.5: "2px",
                1: "4px",
                1.5: "6px",
                2: "8px",
                2.5: "10px",
                3: "12px",
                3.5: "14px",
                4: "16px",
                4.5: "18px",
                5: "20px",
                5.5: "22px",
                6: "24px",
                6.5: "26px",
                7: "28px",
                7.5: "30px",
                8: "32px",
                8.5: "34px",
                9: "36px",
                9.5: "38px",
                10: "40px",
                11: "44px",
                12: "48px",
                14: "56px",
                16: "64px",
                20: "80px",
                24: "96px",
                28: "112px",
                32: "128px",
                36: "144px",
                40: "160px",
                44: "176px",
                48: "192px",
                52: "208px",
                56: "224px",
                60: "240px",
                64: "256px",
                72: "288px",
                80: "320px",
                96: "384px",
                97.5: "390px",
                120: "480px",
                150: "600px",
                160: "640px",
                175: "700px",
                "1/2": "50%",
                "1/3": "33.333333%",
                "2/3": "66.666667%",
                "1/4": "25%",
                "2/4": "50%",
                "3/4": "75%",
                "1/5": "20%",
                "2/5": "40%",
                "3/5": "60%",
                "4/5": "80%",
                "1/6": "16.666667%",
                "2/6": "33.333333%",
                "3/6": "50%",
                "4/6": "66.666667%",
                "5/6": "83.333333%",
                "1/12": "8.333333%",
                "2/12": "16.666667%",
                "3/12": "25%",
                "4/12": "33.333333%",
                "5/12": "41.666667%",
                "6/12": "50%",
                "7/12": "58.333333%",
                "8/12": "66.666667%",
                "9/12": "75%",
                "10/12": "83.333333%",
                "11/12": "91.666667%",
              },
              borderRadius: {
                none: "0px",
                sm: "2px",
                DEFAULT: "4px",
                md: "6px",
                lg: "8px",
                xl: "12px",
                "2xl": "16px",
                "3xl": "24px",
              },
            },
          },
        }}
      >
        <Body className="bg-white px-3 py-6">
          <Container className="max-w-lg">
            <Section className="mb-4">
              <Img src={absoluteUrl("/logo.png")} alt="Rallly" width={128} />
            </Section>
            <Section>
              <Text>Hi {recipientName},</Text>
              {children}
              {footNote ? (
                <>
                  <Hr />
                  <SmallText>{footNote}</SmallText>
                </>
              ) : null}
            </Section>
            <Section className="mt-4 text-sm text-slate-500">
              <Link className="font-sans text-slate-500" href={absoluteUrl()}>
                Home
              </Link>
              &nbsp;&bull;&nbsp;
              <Link
                className="font-sans text-slate-500"
                href="https://twitter.com/ralllyco"
              >
                Twitter
              </Link>
              &nbsp;&bull;&nbsp;
              <Link
                className="font-sans text-slate-500"
                href="https://github.com/lukevella/rallly"
              >
                Github
              </Link>
              &nbsp;&bull;&nbsp;
              <Link
                className="font-sans text-slate-500"
                href="https://www.paypal.com/donate/?hosted_button_id=7QXP2CUBLY88E"
              >
                Donate
              </Link>
              &nbsp;&bull;&nbsp;
              <Link
                className="font-sans text-slate-500"
                href={`mailto:${process.env.SUPPORT_EMAIL}`}
              >
                Contact
              </Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
