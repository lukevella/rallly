"use client";

import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { FormItem, FormLabel } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { PlusIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  MAX_PLACE_ADDRESS_LENGTH,
  MAX_PLACE_NAME_LENGTH,
  MAX_PLACE_URL_LENGTH,
  MAX_POLL_PLACES,
} from "@/features/poll/schema";
import { Trans, useTranslation } from "@/i18n/client";
import type { NewEventData } from "./types";

export const emptyPlace = { name: "", address: "", url: "" };

export const PollPlacesForm = () => {
  const { t } = useTranslation();
  const form = useFormContext<NewEventData>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "places",
  });

  // A location poll needs at least one row to type into.
  React.useEffect(() => {
    if (fields.length === 0) {
      append(emptyPlace, { shouldFocus: false });
    }
  }, [fields.length, append]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans i18nKey="places" defaults="Places" />
        </CardTitle>
        <CardDescription>
          <Trans
            i18nKey="placesDescription"
            defaults="Propose the places participants can vote between"
          />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <fieldset
            key={field.id}
            className="space-y-3 rounded-xl border p-3"
            data-testid="place-row"
          >
            <div className="flex items-end gap-x-2">
              <FormItem className="flex-1">
                <FormLabel htmlFor={`places.${index}.name`}>
                  <Trans i18nKey="placeName" defaults="Name" />
                </FormLabel>
                <Input
                  id={`places.${index}.name`}
                  type="text"
                  maxLength={MAX_PLACE_NAME_LENGTH}
                  placeholder={t("placeNamePlaceholder", {
                    defaultValue: "Café du Centre",
                  })}
                  {...form.register(`places.${index}.name`)}
                />
              </FormItem>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={fields.length === 1}
                aria-label={t("removePlace", { defaultValue: "Remove place" })}
                onClick={() => remove(index)}
              >
                <Trash2Icon />
              </Button>
            </div>
            <FormItem>
              <FormLabel htmlFor={`places.${index}.address`}>
                <Trans i18nKey="placeAddress" defaults="Address" />
              </FormLabel>
              <Input
                id={`places.${index}.address`}
                type="text"
                maxLength={MAX_PLACE_ADDRESS_LENGTH}
                placeholder={t("placeAddressPlaceholder", {
                  defaultValue: "12 rue de la Paix, Paris",
                })}
                {...form.register(`places.${index}.address`)}
              />
            </FormItem>
            <FormItem>
              <FormLabel htmlFor={`places.${index}.url`}>
                <Trans i18nKey="placeLink" defaults="Link" />
              </FormLabel>
              <Input
                id={`places.${index}.url`}
                type="url"
                maxLength={MAX_PLACE_URL_LENGTH}
                placeholder="https://maps.example.com/…"
                {...form.register(`places.${index}.url`)}
              />
            </FormItem>
          </fieldset>
        ))}
        <Button
          type="button"
          className="rounded-full"
          disabled={fields.length >= MAX_POLL_PLACES}
          onClick={() => append(emptyPlace)}
        >
          <PlusIcon data-icon="inline-start" />
          <Trans i18nKey="addPlace" defaults="Add place" />
        </Button>
      </CardContent>
    </Card>
  );
};
