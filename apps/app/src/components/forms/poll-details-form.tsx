import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useForm } from "react-hook-form";

import { requiredString } from "../../utils/form-validation";
import { PollFormProps } from "./types";

export interface PollDetailsData {
  title: string;
  location: string;
  description: string;
}

export const PollDetailsForm: React.FunctionComponent<
  PollFormProps<PollDetailsData>
> = ({ name, defaultValues, onSubmit, onChange, className }) => {
  const { t } = useTranslation("app");
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm<PollDetailsData>({ defaultValues });

  React.useEffect(() => {
    if (onChange) {
      const subscription = watch(onChange);
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [onChange, watch]);

  return (
    <form
      id={name}
      className={clsx("max-w-full", className)}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="formField">
        <label htmlFor="title">{t("title")}</label>
        <input
          type="text"
          id="title"
          className={clsx("input w-full", {
            "input-error": errors.title,
          })}
          placeholder={t("titlePlaceholder")}
          {...register("title", { validate: requiredString })}
        />
      </div>
      <div className="formField">
        <label htmlFor="location">{t("location")}</label>
        <input
          type="text"
          id="location"
          className="input w-full"
          placeholder={t("locationPlaceholder")}
          {...register("location")}
        />
      </div>
      <div>
        <label htmlFor="description">{t("description")}</label>
        <textarea
          id="description"
          className="input w-full"
          placeholder={t("descriptionPlaceholder")}
          rows={5}
          {...register("description")}
        />
      </div>
    </form>
  );
};
