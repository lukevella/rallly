import clsx from "clsx";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

export const LanguageSelect: React.VoidFunctionComponent<{
  className?: string;
  onChange?: (language: string) => void;
}> = ({ className, onChange }) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  return (
    <select
      className={clsx("input", className)}
      defaultValue={router.locale}
      onChange={(e) => {
        Cookies.set("NEXT_LOCALE", e.target.value, {
          expires: 365,
        });
        onChange?.(e.target.value);
      }}
    >
      <option value="en">{t("english")}</option>
      <option value="fr">{t("french")}</option>
      <option value="de">{t("german")}</option>
      <option value="sv">{t("swedish")}</option>
    </select>
  );
};
