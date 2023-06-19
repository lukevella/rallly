import { Trans as BaseTrans, useTranslation } from "next-i18next";

type TransWithContextProps = Omit<React.ComponentProps<typeof BaseTrans>, "t">;

export const Trans = (props: TransWithContextProps) => {
  const { t } = useTranslation();
  return <BaseTrans t={t} {...props} />;
};
