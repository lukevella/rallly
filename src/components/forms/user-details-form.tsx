import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useForm } from "react-hook-form";

import { requiredString, validEmail } from "../../utils/form-validation";
import { PollFormProps } from "./types";

export interface UserDetailsData {
  name: string;
  contact: string;
}

export const UserDetailsForm: React.VoidFunctionComponent<
  PollFormProps<UserDetailsData>
> = ({ name, defaultValues, onSubmit, onChange, className }) => {
  const { t } = useTranslation("app");
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm<UserDetailsData>({ defaultValues });

  React.useEffect(() => {
    if (onChange) {
      const subscription = watch(onChange);
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [watch, onChange]);

  return (
    <form
      id={name}
      className={className}
      style={{ width: 400 }}
      onSubmit={handleSubmit(onSubmit)}
    >
      <h2>{t("yourDetails")}</h2>
      <div className="formField">
        <label className="text-slate-500" htmlFor="name">
          {t("name")}
        </label>
        <input
          type="text"
          id="name"
          className={clsx("input w-full", {
            "input-error": errors.name,
          })}
          placeholder={t("namePlaceholder")}
          {...register("name", { validate: requiredString })}
        />
      </div>

      <div className="formField">
        <label className="text-slate-500" htmlFor="contact">
          {t("email")}
        </label>
        <input
          id="contact"
          className={clsx("input w-full", {
            "input-error": errors.contact,
          })}
          placeholder={t("emailPlaceholder")}
          {...register("contact", {
            validate: validEmail,
          })}
        />
      </div>
    </form>
  );
};
