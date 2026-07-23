"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@rallly/ui";
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
import { useForm } from "react-hook-form";
import * as z from "zod";
import { LanguageSelect } from "@/components/language-selector";
import { updateLocalizationAction } from "@/features/user/actions";
import { Trans } from "@/i18n/client";
import { setLocaleCookie, useLocale } from "@/lib/locale/client";
import { useSafeAction } from "@/lib/safe-action/client";

const formSchema = z.object({
  language: z.string(),
});

export const LanguagePreference = ({
  defaultValue,
}: {
  defaultValue?: string;
}) => {
  const { locale } = useLocale();
  const updateLocalization = useSafeAction(updateLocalizationAction);

  // The saved preference can differ from the locale the app is rendered in
  // (e.g. the cookie was reset on this device). Saving must be possible in
  // that state even though the field matches its default.
  const savedLanguage = defaultValue ?? locale;

  const form = useForm({
    defaultValues: {
      language: savedLanguage,
    },
    resolver: zodResolver(formSchema),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          // Set the cookie before executing: useSafeAction refreshes the router
          // on success, and that refresh must read the new locale. Writing the
          // cookie server-side would collide with updateUser's session cookie
          // and drop it. Nothing reconciles the cookie against the saved value
          // on load, so roll it back to the locale this page is rendered in if
          // the save doesn't land.
          const previousLocale = locale;
          setLocaleCookie(data.language);

          let result: Awaited<
            ReturnType<typeof updateLocalization.executeAsync>
          >;
          try {
            result = await updateLocalization.executeAsync({
              locale: data.language,
            });
          } catch (error) {
            setLocaleCookie(previousLocale);
            throw error;
          }

          if (result?.serverError || result?.validationErrors) {
            setLocaleCookie(previousLocale);
            return;
          }

          form.reset({ language: data.language });
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
                  className="w-fit min-w-32"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            disabled={!form.formState.isDirty && savedLanguage === locale}
            loading={form.formState.isSubmitting}
            type="submit"
          >
            <Trans i18nKey="save" />
          </Button>
          <Link
            target="_blank"
            href="https://support.rallly.co/contribute/translations"
            className={buttonVariants({ variant: "ghost" })}
          >
            <Trans i18nKey="becomeATranslator" defaults="Help translate" />
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </form>
    </Form>
  );
};
