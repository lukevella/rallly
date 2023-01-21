import clsx from "clsx";
import Cookies from "js-cookie";
import useTranslation from "next-translate/useTranslation";

export const LanguageSelect: React.VoidFunctionComponent<{
  className?: string;
  onChange?: (language: string) => void;
}> = ({ className, onChange }) => {
  const { lang } = useTranslation("common");
  return (
    <select
      className={clsx("input", className)}
      defaultValue={lang}
      onChange={(e) => {
        Cookies.set("NEXT_LOCALE", e.target.value, {
          expires: 365,
        });
        onChange?.(e.target.value);
      }}
    >
      <option value="en">English</option>
      <option value="ca">Català</option>
      <option value="cs">Česky</option>
      <option value="zh">汉语</option>
      <option value="da">Dansk</option>
      <option value="de">Deutsch</option>
      <option value="es">Español</option>
      <option value="fi">Suomi</option>
      <option value="fr">Français</option>
      <option value="hr">Hrvatski</option>
      <option value="it">Italiano</option>
      <option value="ko">한국어</option>
      <option value="hu">Magyar</option>
      <option value="nl">Nederlands</option>
      <option value="pl">Polski</option>
      <option value="pt">Português</option>
      <option value="pt-BR">Português - Brasil</option>
      <option value="ru">Pусский</option>
      <option value="sk">Slovenčina</option>
      <option value="sv">Svenska</option>
    </select>
  );
};
