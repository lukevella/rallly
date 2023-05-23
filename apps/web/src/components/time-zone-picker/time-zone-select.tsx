import dayjs from "dayjs";

import { Trans } from "@/components/trans";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

import timeZones from "./time-zones.json";

const options = Object.entries(timeZones).map(([value, label]) => ({
  value,
  label,
}));

export const TimeZoneSelect = ({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (newValue: string) => void;
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">
          <Trans
            i18nKey="timeZoneSelect__automatic"
            defaults="Automatic ({timeZone})"
            values={{ timeZone: getBrowserTimeZone() }}
          />
        </SelectItem>
        {options.map(({ value, label }) => (
          <SelectItem key={value} value={value} className="w-full">
            <div className="flex w-full items-center justify-between gap-x-2">
              <div className="grow">{label}</div>
              <div className="rounded-full border bg-gray-100 py-0.5 px-1.5 text-xs text-gray-500">
                {dayjs().tz(value).format("LT")}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
