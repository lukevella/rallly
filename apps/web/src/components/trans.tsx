import { Trans as BaseTrans } from "react-i18next";

import { useTranslation } from "@/app/i18n/client";

type TransWithContextProps = Omit<React.ComponentProps<typeof BaseTrans>, "t">;

export const Trans = (props: TransWithContextProps) => {
  const { t } = useTranslation();
  return <BaseTrans t={t} {...props} />;
};
