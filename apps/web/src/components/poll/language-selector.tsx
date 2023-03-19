import clsx from "clsx";
import Cookies from "js-cookie";
import { useTranslation } from "next-i18next";

import ChevronDown from "@/components/icons/chevron-down.svg";

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
        {[
          { code: "ca", name: "Català" },
          { code: "cs", name: "Česky" },
          { code: "da", name: "Dansk" },
          { code: "de", name: "Deutsch" },
          { code: "en", name: "English" },
          { code: "es", name: "Español" },
          { code: "fi", name: "Suomi" },
          { code: "fr", name: "Français" },
          { code: "hr", name: "Hrvatski" },
          { code: "hu", name: "Magyar" },
          { code: "it", name: "Italiano" },
          { code: "ko", name: "한국어" },
          { code: "nl", name: "Nederlands" },
          { code: "pl", name: "Polski" },
          { code: "pt", name: "Português" },
          { code: "pt-BR", name: "Português - Brasil" },
          { code: "ru", name: "Pусский" },
          { code: "sk", name: "Slovenčina" },
          { code: "sv", name: "Svenska" },
          { code: "vi", name: "Tiếng Việt" },
          { code: "zh", name: "汉语" },
        ].map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <ChevronDown className="w-5" />
      </div>
    </div>
  );
};
