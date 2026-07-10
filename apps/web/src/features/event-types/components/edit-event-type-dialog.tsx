"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
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
  eventTypeToFormValues,
  eventTypeValuesToInput,
} from "@/features/event-types/components/event-type-form";
import type { EventTypeDTO } from "@/features/event-types/types";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function EditEventTypeDialog({
  eventType,
  open,
  onOpenChange,
}: DialogProps & {
  eventType: EventTypeDTO;
}) {
  const { t } = useTranslation();
  const updateEventType = trpc.eventTypes.update.useMutation();

  const initialValues = React.useMemo(
    () => eventTypeToFormValues(eventType),
    [eventType],
  );

  const [showMaxAttendees, setShowMaxAttendees] = React.useState(
    eventType.capacity !== null,
  );
  const [showDescription, setShowDescription] = React.useState(
    eventType.description !== null,
  );

  const formSchema = React.useMemo(() => buildEventTypeFormSchema(t), [t]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  React.useEffect(() => {
    form.reset(initialValues);
    setShowMaxAttendees(eventType.capacity !== null);
    setShowDescription(eventType.description !== null);
  }, [eventType.capacity, eventType.description, form, initialValues]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(initialValues);
      setShowMaxAttendees(eventType.capacity !== null);
      setShowDescription(eventType.description !== null);
    }
    onOpenChange?.(nextOpen);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const input = eventTypeValuesToInput(values);

    try {
      await updateEventType.mutateAsync({ id: eventType.id, ...input });
    } catch {
      toast.error(
        t("updateEventTypeError", {
          defaultValue: "Failed to update event type",
        }),
      );
      return;
    }
    posthog?.capture("event_type_edit:form_submit", {
      event_type_id: eventType.id,
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
            <Trans i18nKey="editEventTypeTitle" defaults="Edit Event Type" />
          </DialogTitle>
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
              <DialogClose
                render={
                  <Button type="button" disabled={updateEventType.isPending} />
                }
              >
                <Trans i18nKey="cancel" defaults="Cancel" />
              </DialogClose>
              <Button
                type="submit"
                variant="primary"
                loading={updateEventType.isPending}
              >
                <Trans i18nKey="save" defaults="Save" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
