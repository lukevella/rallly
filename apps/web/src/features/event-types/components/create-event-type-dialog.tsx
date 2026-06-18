"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { Form } from "@rallly/ui/form";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import { useForm } from "react-hook-form";
import {
  buildEventTypeFormSchema,
  EventTypeFormFields,
  eventTypeFormDefaults,
  eventTypeValuesToInput,
} from "@/features/event-types/components/event-type-form";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function CreateEventTypeDialog({ open, onOpenChange }: DialogProps) {
  const { t } = useTranslation();
  const createEventType = trpc.eventTypes.create.useMutation();
  const [showMaxAttendees, setShowMaxAttendees] = React.useState(false);
  const [showDescription, setShowDescription] = React.useState(false);

  const formSchema = React.useMemo(() => buildEventTypeFormSchema(t), [t]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: eventTypeFormDefaults,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(eventTypeFormDefaults);
      setShowMaxAttendees(false);
      setShowDescription(false);
    }
    onOpenChange?.(nextOpen);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const input = eventTypeValuesToInput(values);

    try {
      await createEventType.mutateAsync(input);
    } catch {
      toast.error(
        t("createEventTypeError", {
          defaultValue: "Failed to create event type",
        }),
      );
      return;
    }
    posthog?.capture("event_type_creation:form_submit", {
      duration_minutes: input.duration,
      location_type: input.location?.type ?? "none",
      has_max_attendees: input.capacity !== null,
      has_description: input.description !== null,
    });
    handleOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            <Trans
              i18nKey="createEventTypeTitle"
              defaults="Create Event Type"
            />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="createEventTypeDescription"
              defaults="Set up a reusable event type that people can book with you."
            />
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            <EventTypeFormFields
              form={form}
              showMaxAttendees={showMaxAttendees}
              setShowMaxAttendees={setShowMaxAttendees}
              showDescription={showDescription}
              setShowDescription={setShowDescription}
            />
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" disabled={createEventType.isPending}>
                  <Trans i18nKey="cancel" defaults="Cancel" />
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="primary"
                loading={createEventType.isPending}
              >
                <Trans i18nKey="create" defaults="Create" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
