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
import clsx from "clsx";

export const Text = (props: TextProps) => {
  return (
    <UnstyledText
      {...props}
      className={clsx(
        "my-4 font-sans text-base text-slate-800",
        props.className,
      )}
    />
  );
};

export const Button = (props: ButtonProps) => {
  return (
    <UnstyledButton
      {...props}
      className={clsx(
        "bg-primary-500 rounded px-3 py-2 font-sans text-white",
        props.className,
      )}
    />
  );
};

export const Link = (props: LinkProps) => {
  return (
    <UnstyledLink
      {...props}
      className={clsx("text-primary-500 font-sans text-base", props.className)}
    />
  );
};

export const Heading = (
  props: React.ComponentProps<typeof UnstyledHeading>,
) => {
  return (
    <UnstyledHeading
      {...props}
      as={props.as || "h3"}
      className={clsx("my-4 font-sans text-slate-800", props.className)}
    />
  );
};

export const Section = (props: SectionProps) => {
  return (
    <UnstyledSection {...props} className={clsx("my-4", props.className)} />
  );
};
