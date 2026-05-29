"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@rallly/ui";
import {
  ActionBar,
  ActionBarButton,
  ActionBarOffset,
} from "@rallly/ui/action-bar";
import { Field, FieldError, FieldGroup, FieldLabel } from "@rallly/ui/field";
import { Input } from "@rallly/ui/input";
import { CheckIcon, MapPinIcon, VideoIcon, XIcon } from "lucide-react";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { ConferencingLink } from "@/features/conferencing/components/conferencing-link";
import type { Conferencing } from "@/features/conferencing/schema";
import { submitRsvpAction } from "@/features/scheduled-event/actions";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import type { Attendee } from "./attendee-rows";
import { AttendeeRows } from "./attendee-rows";
import {
  Section,
  SectionGroup,
  SectionItem,
  SectionItemLabel,
  SectionItemValue,
} from "./section";

type RsvpStatus = "accepted" | "declined";

export function EventWizard({
  eventId,
  description,
  locationText,
  conferencing,
  attendees,
}: {
  eventId: string;
  description: string | null;
  locationText: string | null;
  conferencing: Conferencing | null;
  attendees: Attendee[];
}) {
  const [response, setResponse] = React.useState<RsvpStatus | null>(null);

  if (response !== null) {
    return (
      <div className="space-y-6 px-3">
        <RsvpResponseBanner
          response={response}
          onChange={() => setResponse(null)}
        />
        <RsvpForm eventId={eventId} status={response} />
      </div>
    );
  }

  return (
    <>
      <EventBody
        description={description}
        locationText={locationText}
        conferencing={conferencing}
        attendees={attendees}
      />
      <ActionBarOffset />
      <RsvpActions onPick={setResponse} />
    </>
  );
}

function EventBody({
  description,
  locationText,
  conferencing,
  attendees,
}: {
  description: string | null;
  locationText: string | null;
  conferencing: Conferencing | null;
  attendees: Attendee[];
}) {
  return (
    <div className="px-3 pb-3">
      <SectionGroup>
        {locationText || conferencing ? (
          <Section>
            {locationText ? (
              <SectionItem>
                <SectionItemLabel>
                  <MapPinIcon />
                  <Trans i18nKey="location" defaults="Location" />
                </SectionItemLabel>
                <SectionItemValue className="text-foreground">
                  {locationText}
                </SectionItemValue>
              </SectionItem>
            ) : null}
            {conferencing ? (
              <SectionItem>
                <SectionItemLabel>
                  <VideoIcon />
                  <Trans i18nKey="conferencing" defaults="Conferencing" />
                </SectionItemLabel>
                <SectionItemValue className="overflow-hidden">
                  <ConferencingLink conferencing={conferencing} />
                </SectionItemValue>
              </SectionItem>
            ) : null}
          </Section>
        ) : null}

        {description ? (
          <Section
            title={<Trans i18nKey="description" defaults="Description" />}
          >
            <SectionItem className="py-3">
              <p className="whitespace-pre-wrap text-pretty text-foreground text-sm leading-relaxed">
                <TruncatedLinkify>{description}</TruncatedLinkify>
              </p>
            </SectionItem>
          </Section>
        ) : null}

        {attendees.length > 0 ? (
          <Section title={<Trans i18nKey="attendees" defaults="Attendees" />}>
            <SectionItem>
              <SectionItemLabel>
                <Trans i18nKey="invited" defaults="Invited" />
              </SectionItemLabel>
              <SectionItemValue className="tabular-nums">
                {attendees.length}
              </SectionItemValue>
            </SectionItem>
            <AttendeeRows attendees={attendees} />
          </Section>
        ) : null}
      </SectionGroup>
    </div>
  );
}

function RsvpActions({ onPick }: { onPick: (status: RsvpStatus) => void }) {
  return (
    <ActionBar>
      <ActionBarButton
        variant="default"
        className="flex-1"
        onClick={() => onPick("declined")}
      >
        <XIcon />
        <Trans i18nKey="rsvpDecline" defaults="Decline" />
      </ActionBarButton>
      <ActionBarButton
        variant="primary"
        className="flex-1"
        onClick={() => onPick("accepted")}
      >
        <CheckIcon />
        <Trans i18nKey="attendeeStatusGoing" defaults="Going" />
      </ActionBarButton>
    </ActionBar>
  );
}

function RsvpResponseBanner({
  response,
  onChange,
}: {
  response: RsvpStatus;
  onChange: () => void;
}) {
  const isAccepted = response === "accepted";
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3",
        isAccepted
          ? "border-green-400/20 bg-green-400/10 dark:bg-green-950/30"
          : "border-red-400/20 bg-red-400/10 dark:bg-red-950/30",
      )}
    >
      {isAccepted ? (
        <CheckIcon className="size-4 shrink-0 text-green-600 dark:text-green-400" />
      ) : (
        <XIcon className="size-4 shrink-0 text-red-600 dark:text-red-400" />
      )}
      <p className="flex-1 text-foreground text-sm">
        {isAccepted ? (
          <Trans i18nKey="rsvpResponseHeadingGoing" defaults="You're going" />
        ) : (
          <Trans
            i18nKey="rsvpResponseHeadingDeclining"
            defaults="You're declining"
          />
        )}
      </p>
      <button
        type="button"
        onClick={onChange}
        className="font-medium text-muted-foreground text-sm hover:text-foreground hover:underline"
      >
        <Trans i18nKey="rsvpChange" defaults="Change" />
      </button>
    </div>
  );
}

function useRsvpFormSchema() {
  const { t } = useTranslation();
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("nameRequired", { defaultValue: "Please enter your name" })),
    email: z.email(
      t("invalidEmail", {
        defaultValue: "Please enter a valid email address",
      }),
    ),
  });
}

function RsvpForm({
  eventId,
  status,
}: {
  eventId: string;
  status: RsvpStatus;
}) {
  const { t } = useTranslation();
  const schema = useRsvpFormSchema();
  const submitRsvp = useSafeAction(submitRsvpAction);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
        const result = await submitRsvp.executeAsync({
          eventId,
          status,
          name: data.name,
          email: data.email,
        });

        if (result.data?.ok === false) {
          if (result.data.reason === "already_responded") {
            form.setError("email", {
              message: t("rsvpAlreadyResponded", {
                defaultValue:
                  "It looks like you've already responded with this email",
              }),
            });
          }
        }
      })}
    >
      <FieldGroup>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                <Trans i18nKey="name" defaults="Name" />
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder={t("namePlaceholder")}
                autoFocus={true}
                autoComplete="name"
                disabled={form.formState.isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                <Trans i18nKey="email" defaults="Email" />
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
                disabled={form.formState.isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <ActionBar>
        <ActionBarButton
          variant="primary"
          className="flex-1"
          type="submit"
          loading={form.formState.isSubmitting}
        >
          <Trans i18nKey="confirmResponse" defaults="Confirm response" />
        </ActionBarButton>
      </ActionBar>
    </form>
  );
}
