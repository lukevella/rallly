import clsx from "clsx";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { usePlausible } from "next-plausible";
import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/button";
import Magic from "@/components/icons/magic.svg";
import { validEmail } from "@/utils/form-validation";

import { trpc } from "../utils/trpc";

const LoginForm: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("app");
  const { register, formState, handleSubmit, getValues } =
    useForm<{ email: string }>();

  const login = trpc.useMutation(["login"]);

  const plausible = usePlausible();
  const router = useRouter();
  return (
    <div className="flex">
      <div className="hidden items-center rounded-tl-lg rounded-bl-lg bg-slate-50 p-6 md:flex">
        <Magic className="h-24 text-slate-300" />
      </div>
      <div className="max-w-sm p-6">
        <div className="mb-2 text-xl font-semibold">
          {t("loginViaMagicLink")}
        </div>
        {!formState.isSubmitSuccessful ? (
          <form
            onSubmit={handleSubmit(async ({ email }) => {
              plausible("Login requested");
              await login.mutateAsync({ email, path: router.asPath });
            })}
          >
            <div className="mb-2 text-slate-500">
              {t("loginViaMagicLinkDescription")}
            </div>
            <div className="mb-4">
              <input
                autoFocus={true}
                readOnly={formState.isSubmitting}
                className={clsx("input w-full", {
                  "input-error": formState.errors.email,
                })}
                placeholder="john.doe@email.com"
                {...register("email", { validate: validEmail })}
              />
              {formState.errors.email ? (
                <div className="mt-1 text-sm text-rose-500">
                  {t("loginWithValidEmail")}
                </div>
              ) : null}
            </div>
            <div className="flex space-x-3">
              <Button
                htmlType="submit"
                loading={formState.isSubmitting}
                type="primary"
              >
                {t("loginSendMagicLink")}
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <div className="text-slate-500">{t("loginMagicLinkSent")}</div>
            <div className="font-mono text-primary-500">
              {getValues("email")}
            </div>
            <div className="mt-2 text-slate-500">{t("loginCheckInbox")}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
