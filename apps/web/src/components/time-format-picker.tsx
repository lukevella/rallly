import { TimeFormat } from "@rallly/database";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";

import { Trans } from "@/components/trans";

interface TimeFormatPickerProps {
  value: TimeFormat;
  onChange?: (value: TimeFormat) => void;
  disabled?: boolean;
}

const TimeFormatPicker = ({
  disabled,
  value,
  onChange,
}: TimeFormatPickerProps) => {
  return (
    <RadioGroup value={value} onValueChange={onChange} disabled={disabled}>
      <div className="grid gap-y-1">
        <label className="flex items-center gap-x-2">
          <RadioGroupItem value="hours12" />
          <span>
            <Trans i18nKey="12h" />
          </span>
        </label>
        <label className="flex items-center gap-x-2">
          <RadioGroupItem value="hours24" />
          <span>
            <Trans i18nKey="24h" />
          </span>
        </label>
      </div>
    </RadioGroup>
  );
};

export { TimeFormatPicker };
