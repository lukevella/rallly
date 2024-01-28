import {
  Button as UnstyledButton,
  Heading as UnstyledHeading,
  Link as UnstyledLink,
  LinkProps,
  Section as UnstyledSection,
  SectionProps,
  Text as UnstyledText,
  TextProps,
} from "@react-email/components";

import { EmailContext } from "./email-context";

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
        color: light ? "#64748B" : "#334155",
        lineHeight: "1.5",
        ...props.style,
      }}
    />
  );
};

export const Domain = ({ ctx }: { ctx: EmailContext }) => {
  const { baseUrl, domain } = ctx;
  return <Link href={baseUrl}>{domain}</Link>;
};

export const Button = (props: React.ComponentProps<typeof UnstyledButton>) => {
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
      className="font-sans font-bold text-gray-900"
      style={{
        fontSize: fontSize[as],
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
