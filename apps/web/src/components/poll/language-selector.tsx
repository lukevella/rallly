import languages from "@rallly/languages";
import Cookies from "js-cookie";
import { useTranslation } from "next-i18next";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const LanguageSelect: React.FunctionComponent<{
  className?: string;
  onChange?: (language: string) => void;
}> = ({ className, onChange }) => {
  const { i18n } = useTranslation();
  return (
      <Select
        defaultValue={i18n.language}
        onValueChange={(value) => {
          Cookies.set("NEXT_LOCALE", value, {
            expires: 365,
          });
          onChange?.(value);
        }}
      >
        <SelectTrigger className={className}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
        {Object.entries(languages).map(([code, name]) => (
          <SelectItem key={code} value={code}>
            {name}
          </SelectItem>
        ))}
        </SelectContent>
        
      </Select>
      
  );
};
