"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { useForm } from "react-hook-form";
import * as z from "zod";
import { submitRsvpAction } from "@/features/scheduled-event/actions";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

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
  const submitRsvp = useSafeAction(submitRsvpAction);
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
    resolver: zodResolver(formSchema),
  });

  return (
    <Form {...form}>
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit(async (data) => {
          const result = await submitRsvp.executeAsync({
            eventId,
            name: data.name,
            email: data.email,
            status: "accepted",
          });

          if (result.data?.ok === false) {
            form.setError("email", {
              message: t("eventRegisterAlreadyResponded", {
                defaultValue: "This email has already been used to respond",
              }),
            });
            return;
          }

          if (result.data?.ok) {
            onSuccess({ name: data.name, email: data.email });
          }
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
                  disabled={form.formState.isSubmitting}
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
                  disabled={form.formState.isSubmitting}
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
          loading={form.formState.isSubmitting}
        >
          <Trans i18nKey="register" defaults="Register" />
        </Button>
      </form>
    </Form>
  );
}
