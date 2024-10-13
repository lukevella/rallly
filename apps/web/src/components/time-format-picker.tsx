import type { TimeFormat } from "@rallly/database";
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
        <div className="flex items-center gap-x-2">
          <RadioGroupItem id="hours12" value="hours12" />
          <label htmlFor="hours12">
            <Trans i18nKey="12h" />
          </label>
        </div>
        <div className="flex items-center gap-x-2">
          <RadioGroupItem id="hours24" value="hours24" />
          <label htmlFor="hours24">
            <Trans i18nKey="24h" />
          </label>
        </div>
      </div>
    </RadioGroup>
  );
};

export { TimeFormatPicker };
