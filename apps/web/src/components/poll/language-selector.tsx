import ChevronDown from "@rallly/icons/chevron-down.svg";
import languages from "@rallly/languages";
import clsx from "clsx";
import Cookies from "js-cookie";
import { useTranslation } from "next-i18next";

export const LanguageSelect: React.FunctionComponent<{
  className?: string;
  onChange?: (language: string) => void;
}> = ({ className, onChange }) => {
  const { i18n } = useTranslation("common");
  return (
    <div className="relative">
      <select
        className={clsx("input block pr-4", className)}
        defaultValue={i18n.language}
        onChange={(e) => {
          Cookies.set("NEXT_LOCALE", e.target.value, {
            expires: 365,
          });
          onChange?.(e.target.value);
        }}
      >
        {Object.entries(languages).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <ChevronDown className="w-5" />
      </div>
    </div>
  );
};
