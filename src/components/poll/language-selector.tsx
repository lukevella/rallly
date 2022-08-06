import clsx from "clsx";
import Cookies from "js-cookie";
import { useTranslation } from "next-i18next";

export const LanguageSelect: React.VoidFunctionComponent<{
  className?: string;
  onChange?: (language: string) => void;
}> = ({ className, onChange }) => {
  const { t, i18n } = useTranslation("common");
  return (
    <select
      className={clsx("input", className)}
      defaultValue={i18n.language}
      onChange={(e) => {
        Cookies.set("NEXT_LOCALE", e.target.value, {
          expires: 365,
        });
        onChange?.(e.target.value);
      }}
    >
      <option value="en">{t("english")}</option>
      <option value="es">{t("spanish")}</option>
      <option value="de">{t("german")}</option>
      <option value="fr">{t("french")}</option>
      <option value="it">{t("italian")}</option>
      <option value="pt-BR">{t("portugueseBr")}</option>
      <option value="sv">{t("swedish")}</option>
    </select>
  );
};
