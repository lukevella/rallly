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
import { ChevronLeftIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useLoginWizard } from "@/app/[locale]/(unauthenticated)/login/login-wizard/login-wizard";
import { SSOMenu } from "@/app/[locale]/(unauthenticated)/login/login-wizard/sso-menu";
import { useTranslation } from "@/app/i18n/client";
import { Trans } from "@/components/trans";

const registerNameFormSchema = z.object({
  name: z.string().max(100),
});

type RegisterNameFormValues = z.infer<typeof registerNameFormSchema>;

export function SignUpName() {
  const { state, dispatch } = useLoginWizard();

  const { t } = useTranslation();
  const form = useForm<RegisterNameFormValues>({
    defaultValues: {
      name: state.name,
    },
    resolver: zodResolver(registerNameFormSchema),
  });
  return (
    <div className="space-y-4">
      <div className="space-y-0.5">
        <div className="flex items-start gap-2">
          <button
            className="inlie-block h-7"
            onClick={() => {
              dispatch({ type: "setStep", step: "menu" });
            }}
          >
            <Icon>
              <ChevronLeftIcon />
            </Icon>
          </button>
          <h1 className="text-lg font-bold tracking-tight">
            <Trans
              i18nKey="createANewAccount"
              defaults="Create a New Account"
            />
          </h1>
        </div>

        <p className="text-muted-foreground break-words text-sm">
          <Trans
            i18nKey="createANewAccountDescription"
            values={{ email: state.email }}
            defaults="You are creating an account with {email}"
          />
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (data) => {
            dispatch({ type: "setName", name: data.name });
          })}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="name" defaults="Name" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("namePlaceholder")}
                      autoFocus={true}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <div>
            <Button
              loading={
                form.formState.isSubmitting || form.formState.isSubmitSuccessful
              }
              className="w-full"
              variant="primary"
              type="submit"
            >
              <Trans i18nKey="continue" />
            </Button>
          </div>
        </form>
      </Form>
      <SSOMenu />
    </div>
  );
}
