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
import { Icon } from "@rallly/ui/icon";
import { Input } from "@rallly/ui/input";
import { MailIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import {
  useLoginWizard,
  useLoginWizardProps,
} from "@/app/[locale]/(unauthenticated)/login/login-wizard/login-wizard";
import { Trans } from "@/components/trans";

function useLoginWithEmailSchema() {
  const { t } = useTranslation();
  return z.object({
    email: z.string().email(t("validEmail")),
  });
}

type LoginWithEmailValues = z.infer<ReturnType<typeof useLoginWithEmailSchema>>;

export function LoginWithEmailForm() {
  const { state, dispatch } = useLoginWizard();
  const { checkUserExists } = useLoginWizardProps();
  const loginWithEmailSchema = useLoginWithEmailSchema();
  const form = useForm<LoginWithEmailValues>({
    defaultValues: {
      email: state.email,
    },
    resolver: zodResolver(loginWithEmailSchema),
  });
  const { handleSubmit, formState } = form;
  const { t } = useTranslation();

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async ({ email }) => {
          if (await checkUserExists(email)) {
            dispatch({ type: "login", email });
          } else {
            dispatch({ type: "signup", email });
          }
        })}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="email" />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("emailPlaceholder")}
                  disabled={formState.isSubmitting}
                  autoFocus={true}
                  error={!!formState.errors.email}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <Button
            loading={form.formState.isSubmitting}
            type="submit"
            className="w-full"
          >
            <Icon>
              <MailIcon />
            </Icon>
            <Trans
              i18nKey="continueWith"
              defaults="Continue with {provider}"
              values={{ provider: t("email") }}
            />
          </Button>
        </div>
      </form>
    </Form>
  );
}
