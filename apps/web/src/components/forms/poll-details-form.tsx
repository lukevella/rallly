import { Form, FormItem, FormLabel } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { Textarea } from "@rallly/ui/textarea";
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
  const { t } = useTranslation();
  const form = useForm<PollDetailsData>({ defaultValues });

  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = form;

  React.useEffect(() => {
    if (onChange) {
      const subscription = watch(onChange);
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [onChange, watch]);

  return (
    <Form {...form}>
      <form
        id={name}
        className={clsx("space-y-6", className)}
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* <div className="mb-8">
          <h2 className="">
            <Trans i18nKey="eventDetails" defaults="Event Details" />
          </h2>
          <p className="leading-6 text-gray-500">
            <Trans
              i18nKey="eventDetailsDescription"
              defaults="What are you organzing?"
            />
          </p>
        </div> */}
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
      </form>
    </Form>
  );
};
