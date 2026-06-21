import { Trans } from "react-i18next/TransWithoutContext";

import { createEmailI18n } from "../i18n";
import type { EmailChrome } from "../types";
import { Link, Text } from "./styled-components";

export async function PoweredBy({
  chrome,
  locale = "en",
}: {
  chrome: EmailChrome;
  locale?: string;
}) {
  if (chrome.hideAttribution) {
    return null;
  }

  const { t, i18n } = await createEmailI18n(locale);

  return (
    <Text small light={true}>
      <Trans
        t={t}
        i18n={i18n}
        ns="emails"
        i18nKey="common_poweredBy"
        defaults="Powered by <a>{domain}</a>"
        values={{ domain: "Rallly" }}
        components={{
          a: (
            <Link
              color={chrome.primaryColor}
              href="https://rallly.co?utm_source=email&utm_medium=transactional"
            />
          ),
        }}
      />
    </Text>
  );
}
