"use client";

import { TimeFormat } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";

import { usePreferences } from "@/contexts/preferences";
import { useDayjs } from "@/utils/dayjs";

export function TimeFormatControl() {
  const { timeFormat } = useDayjs();
  const { updatePreferences } = usePreferences();

  return (
    <Select
      value={timeFormat}
      onValueChange={(newValue) => {
        updatePreferences({ timeFormat: newValue as TimeFormat });
      }}
    >
      <SelectTrigger asChild>
        <Button variant="ghost">
          <SelectValue />
        </Button>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="hours12">12h</SelectItem>
        <SelectItem value="hours24">24h</SelectItem>
      </SelectContent>
    </Select>
  );
}
