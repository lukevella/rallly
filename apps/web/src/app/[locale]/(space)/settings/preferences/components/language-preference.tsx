import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { LanguageSelect } from "@/components/poll/language-selector";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { setLocaleCookie } from "@/lib/locale/client";
import { updateLocale } from "../actions";

const formSchema = z.object({
  language: z.string(),
});

export const LanguagePreference = () => {
  const { i18n } = useTranslation();
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      language: i18n.language,
    },
    resolver: zodResolver(formSchema),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          await updateLocale(data.language);
          setLocaleCookie(data.language);
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
              <FormControl>
                <LanguageSelect
                  className="w-fit"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
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
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </form>
    </Form>
  );
};
