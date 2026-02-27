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
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

const createSpaceFormSchema = z.object({
  name: z.string().min(1).max(100),
});

export function CreateSpaceForm() {
  const { t } = useTranslation();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(createSpaceFormSchema),
    defaultValues: {
      name: t("personal", { defaultValue: "Personal" }),
    },
  });

  const createSpace = trpc.spaces.create.useMutation({
    onSuccess: () => {
      router.push("/");
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(({ name }) => {
          createSpace.mutate({ name });
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="spaceName" defaults="Space Name" />
              </FormLabel>
              <FormControl>
                <Input
                  data-1p-ignore="true"
                  placeholder={t("spaceNamePlaceholder", {
                    defaultValue: "e.g. Acme Corp",
                  })}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="primary"
          loading={createSpace.isPending}
          className="w-full"
        >
          <Trans i18nKey="createSpace" defaults="Create Space" />
        </Button>
      </form>
    </Form>
  );
}
