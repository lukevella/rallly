import type { EmailChrome } from "../types";
import { Link, Section, Text } from "./styled-components";

export function PoweredBy({ chrome }: { chrome: EmailChrome }) {
  if (chrome.hideAttribution) {
    return null;
  }

  return (
    <Section>
      <Text small light={true}>
        Powered by{" "}
        <Link color={chrome.primaryColor} href="https://rallly.co">
          Rallly
        </Link>
      </Text>
    </Section>
  );
}
