import { absoluteUrl } from "@rallly/utils";
import {
  Button as UnstyledButton,
  ButtonProps,
  Heading as UnstyledHeading,
  Link as UnstyledLink,
  LinkProps,
  Section as UnstyledSection,
  SectionProps,
  Text as UnstyledText,
  TextProps,
} from "@react-email/components";

import { getDomain } from "./utils";

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
        color: light ? "#64748B" : "#334155",
        lineHeight: "1.5",
        ...props.style,
      }}
    />
  );
};

export const Domain = () => {
  return <Link href={absoluteUrl()}>{getDomain()}</Link>;
};

export const Button = (props: ButtonProps) => {
  return (
    <UnstyledButton
      {...props}
      className={props.className}
      style={{
        backgroundColor: "#4F46E5",
        borderRadius: "4px",
        padding: "12px 14px",
        fontFamily,
        fontSize: "16px",
        color: "white",
      }}
    />
  );
};

export const Link = (props: LinkProps) => {
  return (
    <UnstyledLink
      {...props}
      style={{ color: "#4F46E5", fontFamily, ...props.style }}
    />
  );
};

export const Heading = (
  props: React.ComponentProps<typeof UnstyledHeading>,
) => {
  const { as = "h3" } = props;
  const fontSize = {
    h1: "32px",
    h2: "24px",
    h3: "20px",
    h4: "16px",
    h5: "14px",
    h6: "12px",
  };
  return (
    <UnstyledHeading
      {...props}
      as={as}
      style={{
        marginTop: "16px",
        marginBottom: "8px",
        letterSpacing: "-0.75px",
        fontFamily: "sans-serif",
        fontWeight: "bold",
        fontSize: fontSize[as],
        color: "#1E293B",
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
        borderRadius: "4px",
        backgroundColor: "#F9FAFB",
        paddingRight: "16px",
        paddingLeft: "16px",
        border: "1px solid #E2E8F0",
      }}
    />
  );
};

export const trackingWide = {
  letterSpacing: 2,
};

export const fontFamily =
  "'Inter UI', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif";
