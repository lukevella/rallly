"use client";

import { Button } from "@rallly/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { Textarea } from "@rallly/ui/textarea";
import { Link2Icon, MapPinIcon, PlusIcon } from "lucide-react";
import React from "react";
import type { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import type { EventTypeDTO } from "@/features/event-types/types";
import { Trans, useTranslation } from "@/i18n/client";
import type { Location } from "@/lib/location";

export function buildEventTypeFormSchema(
  t: (key: string, opts: { defaultValue: string }) => string,
) {
  return z
    .object({
      name: z.string().min(1).max(255),
      duration: z.number().int().positive(),
      maxAttendees: z.string().optional(),
      description: z.string().max(2000).optional(),
      locationType: z.enum(["", "in_person", "custom_link"]),
      locationAddress: z.string().optional(),
      locationUrl: z.string().optional(),
      locationText: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.maxAttendees) {
        const parsed = Number(data.maxAttendees);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          ctx.addIssue({
            path: ["maxAttendees"],
            code: "custom",
            message: t("maxAttendeesInvalid", {
              defaultValue: "Must be a positive integer",
            }),
          });
        }
      }
      if (data.locationType === "in_person") {
        if (!data.locationAddress?.trim()) {
          ctx.addIssue({
            path: ["locationAddress"],
            code: "custom",
            message: t("requiredField", { defaultValue: "Required" }),
          });
        }
      } else if (data.locationType === "custom_link") {
        const trimmedUrl = data.locationUrl?.trim();
        if (!trimmedUrl) {
          ctx.addIssue({
            path: ["locationUrl"],
            code: "custom",
            message: t("requiredField", { defaultValue: "Required" }),
          });
        } else {
          try {
            new URL(trimmedUrl);
          } catch {
            ctx.addIssue({
              path: ["locationUrl"],
              code: "custom",
              message: t("urlInvalid", {
                defaultValue: "Must be a valid URL",
              }),
            });
          }
        }
      }
    });
}

export type EventTypeFormValues = z.infer<
  ReturnType<typeof buildEventTypeFormSchema>
>;

export const eventTypeFormDefaults: EventTypeFormValues = {
  name: "",
  duration: 60,
  maxAttendees: "",
  description: "",
  locationType: "",
  locationAddress: "",
  locationUrl: "",
  locationText: "",
};

export function eventTypeToFormValues(
  eventType: EventTypeDTO,
): EventTypeFormValues {
  const location = eventType.location;
  return {
    name: eventType.name,
    duration: eventType.duration,
    maxAttendees: eventType.capacity !== null ? String(eventType.capacity) : "",
    description: eventType.description ?? "",
    locationType: location?.type ?? "",
    locationAddress: location?.type === "in_person" ? location.address : "",
    locationUrl: location?.type === "custom_link" ? location.url : "",
    locationText: location?.type === "custom_link" ? (location.text ?? "") : "",
  };
}

type EventTypeInput = {
  name: string;
  duration: number;
  capacity: number | null;
  description: string | null;
  location: Location | null;
};

export function eventTypeValuesToInput(
  values: EventTypeFormValues,
): EventTypeInput {
  const capacity = values.maxAttendees ? Number(values.maxAttendees) : null;
  const description = values.description?.trim() || null;
  const location: Location | null =
    values.locationType === "in_person" && values.locationAddress
      ? { type: "in_person", address: values.locationAddress.trim() }
      : values.locationType === "custom_link" && values.locationUrl
        ? {
            type: "custom_link",
            url: values.locationUrl.trim(),
            text: values.locationText?.trim() || undefined,
          }
        : null;
  return {
    name: values.name.trim(),
    duration: values.duration,
    capacity,
    description,
    location,
  };
}

export function EventTypeFormFields({
  form,
  showMaxAttendees,
  setShowMaxAttendees,
  showDescription,
  setShowDescription,
}: {
  form: UseFormReturn<EventTypeFormValues>;
  showMaxAttendees: boolean;
  setShowMaxAttendees: (value: boolean) => void;
  showDescription: boolean;
  setShowDescription: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const locationType = form.watch("locationType");

  const handleRemoveMaxAttendees = () => {
    setShowMaxAttendees(false);
    form.setValue("maxAttendees", "");
    form.clearErrors("maxAttendees");
  };

  const handleRemoveDescription = () => {
    setShowDescription(false);
    form.setValue("description", "");
    form.clearErrors("description");
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="name" defaults="Name" />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  name="eventTypeName"
                  autoFocus
                  placeholder={t("eventTypeNamePlaceholder", {
                    defaultValue: "Discovery call",
                  })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="durationLabel" defaults="Duration" />
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    className="pr-10"
                    {...field}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value === "" ? "" : Number(value));
                    }}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground text-sm">
                    <Trans i18nKey="minutesAbbreviation" defaults="min" />
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="locationType"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>
                <Trans i18nKey="location" defaults="Location" />
              </FormLabel>
              {field.value !== "" ? (
                <RemoveOptionalButton
                  onClick={() => {
                    form.setValue("locationType", "");
                    form.setValue("locationAddress", "");
                    form.setValue("locationUrl", "");
                    form.setValue("locationText", "");
                    form.clearErrors(["locationAddress", "locationUrl"]);
                  }}
                />
              ) : null}
            </div>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.clearErrors(["locationAddress", "locationUrl"]);
                }}
                className="grid grid-cols-2 gap-2"
              >
                <RadioCardOption
                  value="in_person"
                  icon={<MapPinIcon className="size-4" />}
                  label={t("locationInPerson", { defaultValue: "In person" })}
                />
                <RadioCardOption
                  value="custom_link"
                  icon={<Link2Icon className="size-4" />}
                  label={t("locationCustomLink", {
                    defaultValue: "Custom link",
                  })}
                />
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />

      {locationType === "in_person" ? (
        <FormField
          control={form.control}
          name="locationAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="address" defaults="Address" />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("addressPlaceholder", {
                    defaultValue: "123 Main Street",
                  })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {locationType === "custom_link" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="locationUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="url" defaults="URL" />
                </FormLabel>
                <FormControl>
                  <Input type="url" {...field} placeholder="https://" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="locationText"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Trans
                    i18nKey="locationDisplayText"
                    defaults="Display text"
                  />
                  <span className="text-muted-foreground">
                    <Trans i18nKey="optionalLabel" defaults="(Optional)" />
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("locationDisplayTextPlaceholder", {
                      defaultValue: "Meeting link",
                    })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ) : null}

      {showMaxAttendees ? (
        <FormField
          control={form.control}
          name="maxAttendees"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>
                  <Trans i18nKey="maxAttendees" defaults="Max attendees" />
                </FormLabel>
                <RemoveOptionalButton onClick={handleRemoveMaxAttendees} />
              </div>
              <FormControl>
                <Input type="number" min={1} step={1} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {showDescription ? (
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>
                  <Trans i18nKey="description" defaults="Description" />
                </FormLabel>
                <RemoveOptionalButton onClick={handleRemoveDescription} />
              </div>
              <FormControl>
                <Textarea
                  {...field}
                  rows={3}
                  placeholder={t("eventTypeDescriptionPlaceholder", {
                    defaultValue: "What is this event about?",
                  })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {!showMaxAttendees || !showDescription ? (
        <div className="flex flex-wrap items-center gap-1">
          {!showMaxAttendees ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowMaxAttendees(true);
                form.setValue("maxAttendees", "1");
              }}
              className="text-muted-foreground"
            >
              <PlusIcon data-icon="inline-start" />
              <Trans i18nKey="setMaxAttendees" defaults="Set max attendees" />
            </Button>
          ) : null}
          {!showDescription ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDescription(true)}
              className="text-muted-foreground"
            >
              <PlusIcon data-icon="inline-start" />
              <Trans i18nKey="addDescription" defaults="Add description" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function RadioCardOption({
  value,
  icon,
  label,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
}) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className="group flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-3 py-2.5 text-sm transition-colors hover:bg-accent has-data-checked:border-primary has-data-checked:bg-primary/5"
    >
      <span className="text-muted-foreground group-has-data-checked:text-primary">
        {icon}
      </span>
      <span className="flex-1 font-normal">{label}</span>
      <RadioGroupItem className="hidden" id={id} value={value} />
    </label>
  );
}

function RemoveOptionalButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-normal text-muted-foreground text-sm underline-offset-2 hover:text-foreground hover:underline"
    >
      <Trans i18nKey="remove" defaults="Remove" />
    </button>
  );
}
