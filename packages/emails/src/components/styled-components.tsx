import type {
  LinkProps,
  SectionProps,
  TextProps,
} from "@react-email/components";
import {
  Column,
  Img,
  Row,
  Body as UnstyledBody,
  Button as UnstyledButton,
  Container as UnstyledContainer,
  Heading as UnstyledHeading,
  Link as UnstyledLink,
  Section as UnstyledSection,
  Text as UnstyledText,
} from "@react-email/components";

import type { EmailChrome } from "../types";

export const lightTextColor = "#4B5563";
export const darkTextColor = "#1F2937";
export const borderColor = "#E2E8F0";

export const Text = (
  props: TextProps & { light?: boolean; small?: boolean },
) => {
  const { light, small, ...forwardProps } = props;
  return (
    <UnstyledText
      {...forwardProps}
      style={{
        margin: "16px 0",
        fontFamily,
        fontSize: small ? "14px" : "16px",
        color: light ? lightTextColor : darkTextColor,
        lineHeight: "1.5",
        ...props.style,
      }}
    />
  );
};

export const Domain = ({ chrome }: { chrome: EmailChrome }) => {
  return (
    <Link color={chrome.primaryColor} href={chrome.baseUrl}>
      {chrome.domain}
    </Link>
  );
};

export const Button = (
  props: React.ComponentProps<typeof UnstyledButton> & { color?: string },
) => {
  return (
    <UnstyledButton
      {...props}
      className={props.className}
      style={{
        backgroundColor: props.color ?? "#4F46E5",
        borderRadius: "6px",
        padding: "14px",
        fontFamily,
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        textAlign: "center",
        fontSize: "16px",
        fontWeight: 500,
        color: "white",
      }}
    />
  );
};

// Emphasis inside copy. Inline weight because <strong> defaults to bold and
// email clients ignore stylesheet overrides.
export const Strong = (props: React.ComponentProps<"strong">) => {
  return <strong {...props} style={{ fontWeight: 600, ...props.style }} />;
};

export const Link = (props: LinkProps & { color?: string }) => {
  return (
    <UnstyledLink
      {...props}
      style={{
        color: props.color ?? "#4F46E5",
        fontFamily,
        ...props.style,
      }}
    />
  );
};

const fontSize = {
  h1: "20px",
  h2: "16px",
  h3: "16px",
  h4: "16px",
  h5: "14px",
  h6: "12px",
};

export const Heading = (
  props: React.ComponentProps<typeof UnstyledHeading>,
) => {
  const { as = "h1" } = props;

  return (
    <UnstyledHeading
      {...props}
      as={as}
      style={{
        fontSize: fontSize[as],
        fontWeight: 600,
        ...props.style,
      }}
    />
  );
};

export const SubHeadingText = (props: TextProps) => {
  return (
    <UnstyledText
      {...props}
      style={{
        marginBottom: "16px",
        marginTop: "8px",
        fontSize: 16,
        color: "#374151",
        fontFamily,
        ...props.style,
      }}
    />
  );
};

export const Section = (props: SectionProps) => {
  return (
    <UnstyledSection
      {...props}
      style={{ marginTop: "16px", marginBottom: "16px", ...props.style }}
    />
  );
};

export const SmallText = (props: TextProps) => {
  return (
    <UnstyledText
      {...props}
      style={{
        fontSize: "14px",
        color: "#6B7280",
        ...props.style,
      }}
    />
  );
};

export const Card = (props: SectionProps) => {
  return (
    <Section
      {...props}
      style={{
        borderRadius: "6px",
        backgroundColor: "#F9FAFB",
        paddingRight: "16px",
        paddingLeft: "16px",
        border: "1px solid #E2E8F0",
      }}
    />
  );
};

export const Signature = () => {
  return (
    <Section>
      <Row>
        <Column
          style={{ width: 48, paddingRight: 12, verticalAlign: "middle" }}
        >
          <Img
            src="https://d39ixtfgglw55o.cloudfront.net/images/luke-2026.jpg"
            alt="Luke Vella"
            style={{ borderRadius: "50%" }}
            width={48}
            height={48}
          />
        </Column>
        <Column style={{ verticalAlign: "middle" }}>
          <UnstyledText
            style={{
              fontSize: 16,
              margin: 0,
              fontWeight: 500,
              color: darkTextColor,
              fontFamily,
            }}
          >
            Luke Vella
          </UnstyledText>
          <UnstyledText
            style={{
              fontSize: 16,
              margin: 0,
              color: lightTextColor,
              fontFamily,
            }}
          >
            Founder
          </UnstyledText>
        </Column>
      </Row>
    </Section>
  );
};

export const trackingWide = {
  letterSpacing: 2,
};

export const fontFamily =
  "'Inter UI', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif";

export const Body = (props: React.ComponentProps<typeof UnstyledBody>) => {
  return (
    <UnstyledBody
      {...props}
      style={{ backgroundColor: "#FFFFFF", ...props.style }}
    />
  );
};

export const Container = (
  props: React.ComponentProps<typeof UnstyledContainer>,
) => {
  return (
    <UnstyledContainer
      {...props}
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        background: "white",
        fontFamily,
        padding: "32px 8px",
        color: darkTextColor,
        ...props.style,
      }}
    />
  );
};
