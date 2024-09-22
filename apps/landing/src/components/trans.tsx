import { Trans as BaseTrans, useTranslation } from "next-i18next";

type TransWithContextProps = Omit<React.ComponentProps<typeof BaseTrans>, "t">;

export const Trans = (props: TransWithContextProps) => {
  const { t } = useTranslation(props.ns);
  return <BaseTrans t={t} {...props} />;
};
