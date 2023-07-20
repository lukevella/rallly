import { XIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@rallly/ui/dialog";
import { FormField, FormItem, FormLabel } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { Label } from "@rallly/ui/label";
import { Switch } from "@rallly/ui/switch";
import { Textarea } from "@rallly/ui/textarea";
import clsx from "clsx";
import dayjs from "dayjs";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useFormContext } from "react-hook-form";

import WeekCalendar from "@/components/forms/poll-options-form/week-calendar";
import { requiredString } from "@/utils/form-validation";

import { NewEventData, PollFormProps } from "./types";

export interface PollDetailsData {
  title: string;
  location: string;
  description: string;
}

export const PollDetailsForm = () => {
  const { t } = useTranslation();
  const form = useFormContext<NewEventData>();

  const {
    register,
    setValue,
    control,
    formState: { errors, touchedFields },
  } = form;

  const options = form.watch("options.options") ?? [];
  return (
    <div className="grid gap-4 py-1">
      <FormItem>
        <FormLabel htmlFor="title">{t("title")}</FormLabel>
        <Input
          type="text"
          id="title"
          className={clsx("w-full", {
            "input-error": errors.eventDetails?.title,
          })}
          placeholder={t("titlePlaceholder")}
          {...register("eventDetails.title", { validate: requiredString })}
        />
      </FormItem>
      <FormItem>
        <FormLabel>{t("location")}</FormLabel>
        <Input
          type="text"
          id="location"
          placeholder={t("locationPlaceholder")}
          {...register("eventDetails.location")}
        />
      </FormItem>
      <FormItem>
        <FormLabel htmlFor="description">{t("description")}</FormLabel>
        <Textarea
          id="description"
          placeholder={t("descriptionPlaceholder")}
          rows={5}
          {...register("eventDetails.description")}
        />
      </FormItem>

      {/* <FormField
        control={control}
        name="allDay"
        render={({ field }) => (
          <FormItem>
            <FormLabel></FormLabel>
            <div className="flex items-center gap-x-2">
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  React.startTransition(() => {
                    field.onChange(checked);
                  });
                }}
              />
              <Label htmlFor="allDay">{t("allDay")}</Label>
            </div>
          </FormItem>
        )}
      /> */}
      {/* {!form.watch("allDay") ? (
        <FormField
          control={control}
          name="options.options"
          render={({ field }) => (
            <FormItem>
              <WeekCalendar
                options={field.value ?? []}
                date={
                  new Date(form.watch("options.navigationDate") ?? Date.now())
                }
                onNavigate={(date) => {
                  setValue("options.navigationDate", date.toISOString());
                }}
                onChange={field.onChange}
                duration={form.watch("options.duration")}
                onChangeDuration={(duration) => {
                  setValue("options.duration", duration);
                }}
              />
            </FormItem>
          )}
        />
      ) : (
        <div>Date Picker</div>
      )} */}
    </div>
  );
};
