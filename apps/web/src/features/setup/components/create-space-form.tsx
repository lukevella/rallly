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
import { z } from "zod";

import { Trans } from "@/components/trans";
import { createSpaceAction } from "@/features/space/actions";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

const createSpaceFormSchema = z.object({
  name: z.string().min(1).max(100),
});

type CreateSpaceFormValues = z.infer<typeof createSpaceFormSchema>;

export function CreateSpaceForm() {
  const { t } = useTranslation();
  const router = useRouter();

  const form = useForm<CreateSpaceFormValues>({
    resolver: zodResolver(createSpaceFormSchema),
    defaultValues: {
      name: t("personal", { defaultValue: "Personal" }),
    },
  });

  const createSpace = useSafeAction(createSpaceAction, {
    onSuccess: () => {
      // Redirect to the main dashboard after successful space creation
      router.push("/");
    },
    onError: (error) => {
      console.error("Failed to create space:", error);
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(({ name }) => {
          createSpace.execute({ name });
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

        {createSpace.result?.serverError && (
          <FormMessage>{createSpace.result.serverError}</FormMessage>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={createSpace.isExecuting}
          className="w-full"
        >
          <Trans i18nKey="createSpace" defaults="Create Space" />
        </Button>
      </form>
    </Form>
  );
}
