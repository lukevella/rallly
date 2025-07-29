"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Trans } from "@/components/trans";

const formSchema = z.object({
  title: z.string().trim().min(1),
});

type DuplicateFormData = z.infer<typeof formSchema>;

export function DuplicateForm({
  name,
  onSubmit,
  defaultValues,
}: {
  name?: string;
  onSubmit?: (data: DuplicateFormData) => void;
  defaultValues?: DuplicateFormData;
}) {
  const form = useForm<DuplicateFormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        id={name}
        onSubmit={form.handleSubmit((data) => {
          onSubmit?.(data);
        })}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="duplicateTitleLabel" defaults="Title" />
                </FormLabel>
                <Input {...field} className="w-full" />
                <FormDescription>
                  <Trans
                    i18nKey="duplicateTitleDescription"
                    defaults="Hint: Give your new poll a unique title"
                  />
                </FormDescription>
              </FormItem>
            );
          }}
        />
      </form>
    </Form>
  );
}
