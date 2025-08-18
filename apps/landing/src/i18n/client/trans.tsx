"use client";
import { Trans as BaseTrans } from "react-i18next";
import { useT } from "@/i18n/client/use-translation";

type TransWithContextProps = Omit<React.ComponentProps<typeof BaseTrans>, "t">;

export const Trans = (props: TransWithContextProps) => {
  const { t } = useT(props.ns);
  return <BaseTrans t={t} {...props} />;
};
