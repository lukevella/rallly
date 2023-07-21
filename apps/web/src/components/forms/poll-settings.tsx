import { EyeOffIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";
import { FormField, FormItem } from "@rallly/ui/form";
import { Label } from "@rallly/ui/label";
import { Switch } from "@rallly/ui/switch";
import { useFormContext } from "react-hook-form";
import { Trans } from "react-i18next";

import { usePlan } from "@/contexts/plan";

export type PollSettingsFormData = {
  hideParticipants: boolean;
  hideScores: boolean;
};

export const PollSettingsForm = () => {
  const form = useFormContext<PollSettingsFormData>();

  const plan = usePlan();

  return (
    <div
      className={cn(
        "grid gap-2.5",
        plan === "free" ? "pointer-events-none opacity-50" : "",
      )}
    >
      <FormField
        control={form.control}
        name="hideParticipants"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-start justify-between gap-x-4 rounded-lg border p-4">
              <div>
                <EyeOffIcon className="h-6 w-6" />
              </div>
              <div className="grid grow gap-1.5 pt-0.5">
                <Label htmlFor="allDay">
                  <Trans i18nKey="hideParticipants">Hide participants</Trans>
                </Label>
                <p className="text-muted-foreground text-sm">
                  <Trans
                    i18nKey="hideParticipantsDescription"
                    defaults="Participants won't be able to see each other's votes and comments"
                  />
                </p>
              </div>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                }}
              />
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};
