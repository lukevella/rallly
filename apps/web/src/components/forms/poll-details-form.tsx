import { FormItem, FormLabel } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { Textarea } from "@rallly/ui/textarea";
import clsx from "clsx";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";

import { requiredString } from "@/utils/form-validation";

import { NewEventData } from "./types";

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
    formState: { errors },
  } = form;

  return (
    <div className="grid gap-4 py-1">
      <FormItem>
        <FormLabel htmlFor="title">{t("title")}</FormLabel>
        <Input
          type="text"
          id="title"
          className={clsx("w-full", {
            "input-error": errors.title,
          })}
          placeholder={t("titlePlaceholder")}
          {...register("title", { validate: requiredString })}
        />
      </FormItem>
      <FormItem>
        <FormLabel>{t("location")}</FormLabel>
        <Input
          type="text"
          id="location"
          placeholder={t("locationPlaceholder")}
          {...register("location")}
        />
      </FormItem>
      <FormItem>
        <FormLabel htmlFor="description">{t("description")}</FormLabel>
        <Textarea
          id="description"
          placeholder={t("descriptionPlaceholder")}
          rows={5}
          {...register("description")}
        />
      </FormItem>
    </div>
  );
};
