import languages from "@rallly/languages";
import { Icon } from "@rallly/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { LanguagesIcon } from "lucide-react";

export const LanguageSelect: React.FunctionComponent<{
  className?: string;
  value?: string;
  onChange?: (language: string) => void;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}> = ({ className, value, onChange, ...ariaProps }) => {
  return (
    <Select
      items={languages}
      value={value}
      onValueChange={(language) => {
        if (language) {
          onChange?.(language);
        }
      }}
    >
      <SelectTrigger className={className} {...ariaProps}>
        <Icon>
          <LanguagesIcon />
        </Icon>
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
