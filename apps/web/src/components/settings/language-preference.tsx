import { Button } from "@rallly/ui/button";
import { Form, FormField, FormItem, FormLabel } from "@rallly/ui/form";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { LanguageSelect } from "@/components/poll/language-selector";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { trpc } from "@/utils/trpc/client";

const formSchema = z.object({
  language: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export const LanguagePreference = () => {
  const { i18n } = useTranslation();
  const { user } = useUser();
  const router = useRouter();
  const form = useForm<FormData>({
    defaultValues: {
      language: i18n.language,
    },
  });

  const updatePreferences = trpc.user.updatePreferences.useMutation();
  const session = useSession();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          if (!user.isGuest) {
            await updatePreferences.mutateAsync({ locale: data.language });
          }
          await session.update({ locale: data.language });
          router.refresh();
        })}
      >
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="common_language" />
              </FormLabel>
              <LanguageSelect value={field.value} onChange={field.onChange} />
            </FormItem>
          )}
        />
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant="primary"
            disabled={!form.formState.isDirty}
            loading={form.formState.isSubmitting}
            type="submit"
          >
            <Trans i18nKey="save" />
          </Button>
          <Button asChild variant="ghost">
            <Link
              target="_blank"
              href="https://support.rallly.co/contribute/translations"
            >
              <Trans i18nKey="becomeATranslator" defaults="Help translate" />
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </form>
    </Form>
  );
};
