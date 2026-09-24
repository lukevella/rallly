"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { submitRsvpAction } from "@/features/scheduled-event/actions";
import { Trans, useTranslation } from "@/i18n/client";

const formSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email(),
});

export function RegistrationForm({
  eventId,
  onSuccess,
}: {
  eventId: string;
  onSuccess: (registration: { name: string; email: string }) => void;
}) {
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
    resolver: zodResolver(formSchema),
  });
  const submitRsvp = useMutation(
    mutationOptions(submitRsvpAction, {
      onSuccess: (data, input) => {
        if (!data.ok) {
          form.setError("email", {
            message: t("eventRegisterAlreadyResponded", {
              defaultValue: "This email has already been used to respond",
            }),
          });
          return;
        }

        onSuccess({ name: input.name, email: input.email });
      },
    }),
  );

  return (
    <Form {...form}>
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit((data) => {
          submitRsvp.mutate({
            eventId,
            name: data.name,
            email: data.email,
            status: "accepted",
          });
        })}
      >
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="name" defaults="Name" />
              </FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  autoComplete="name"
                  disabled={submitRsvp.isPending}
                  placeholder={t("namePlaceholder", {
                    defaultValue: "Jessie Smith",
                  })}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="email" defaults="Email" />
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  disabled={submitRsvp.isPending}
                  placeholder={t("emailPlaceholder", {
                    defaultValue: "jessie.smith@example.com",
                  })}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          size="lg"
          variant="primary"
          type="submit"
          loading={submitRsvp.isPending}
        >
          <Trans i18nKey="register" defaults="Register" />
        </Button>
      </form>
    </Form>
  );
}
