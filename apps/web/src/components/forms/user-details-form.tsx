import { Form, FormItem, FormLabel } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
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

export const UserDetailsForm: React.FunctionComponent<
  PollFormProps<UserDetailsData>
> = ({ name, defaultValues, onSubmit, onChange, className }) => {
  const { t } = useTranslation();
  const form = useForm<UserDetailsData>({ defaultValues });
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = form;
  const isWorking = isSubmitting || isSubmitSuccessful;

  React.useEffect(() => {
    if (onChange) {
      const subscription = watch(onChange);
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [watch, onChange]);

  return (
    <Form {...form}>
      <form id={name} className={className} onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <FormItem>
            <FormLabel htmlFor="name">{t("name")}</FormLabel>
            <Input
              type="text"
              id="name"
              className={clsx("input w-full", {
                "input-error": errors.name,
              })}
              disabled={isWorking}
              placeholder={t("namePlaceholder")}
              {...register("name", { validate: requiredString })}
            />
          </FormItem>
          <FormItem>
            <FormLabel htmlFor="contact">{t("email")}</FormLabel>
            <Input
              id="contact"
              className={clsx("input w-full", {
                "input-error": errors.contact,
              })}
              disabled={isWorking}
              placeholder={t("emailPlaceholder")}
              {...register("contact", {
                validate: validEmail,
              })}
            />
          </FormItem>
        </div>
      </form>
    </Form>
  );
};
