import { Trans as BaseTrans } from "react-i18next/TransWithoutContext";

import { i18nInstance } from "../../i18n";

type TransWithContextProps = Omit<
  React.ComponentProps<typeof BaseTrans>,
  "t" | "i18n"
>;

export function TransEmail(props: TransWithContextProps) {
  return <BaseTrans i18n={i18nInstance} {...props} />;
}
