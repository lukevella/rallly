"use client";
import { Button } from "@rallly/ui/button";
import { Trans, useTranslation } from "next-i18next";
import React from "react";
import { useForm } from "react-hook-form";

import { requiredString } from "../../utils/form-validation";
import { TextInput } from "../text-input";

export const verifyCode = async (options: { email: string; token: string }) => {
  const url = `${
    window.location.origin
  }/api/auth/callback/email?email=${encodeURIComponent(options.email)}&token=${
    options.token
  }`;

  const res = await fetch(url);

  return !res.url.includes("auth/error");
};

export const VerifyCode: React.FunctionComponent<{
  email: string;
  onSubmit: (code: string) => Promise<void>;
  onChangeEmail?: () => void;
}> = ({ onSubmit, onChangeEmail, email }) => {
  const { register, handleSubmit, setError, formState } = useForm<{
    code: string;
  }>();
  const { t } = useTranslation();

  return (
    <div>
      <form
        onSubmit={handleSubmit(async ({ code }) => {
          try {
            await onSubmit(code);
          } catch {
            setError("code", {
              type: "not_found",
              message: t("wrongVerificationCode"),
            });
          }
        })}
      >
        <fieldset>
          <h1 className="mb-1 text-2xl font-bold">{t("verifyYourEmail")}</h1>
          <div className="mb-4 text-gray-500">
            {t("stepSummary", {
              current: 2,
              total: 2,
            })}
          </div>
          <p className="mb-4">
            <Trans
              t={t}
              i18nKey="verificationCodeSent"
              values={{ email }}
              components={{
                b: <strong className="whitespace-nowrap" />,
                a: (
                  <button
                    type="button"
                    role="button"
                    className="text-link"
                    onClick={() => {
                      onChangeEmail?.();
                    }}
                  />
                ),
              }}
            />
          </p>
          <TextInput
            autoFocus={true}
            proportions="lg"
            error={!!formState.errors.code}
            className="w-full"
            placeholder={t("verificationCodePlaceholder")}
            {...register("code", {
              validate: requiredString,
            })}
          />
          {formState.errors.code?.message ? (
            <p className="mb-4 mt-2 text-sm text-rose-500">
              {formState.errors.code.message}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-gray-500">
            {t("verificationCodeHelp")}
          </p>
        </fieldset>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            loading={formState.isSubmitting || formState.isSubmitSuccessful}
            type="submit"
            size="lg"
            variant="primary"
          >
            {t("continue")}
          </Button>
        </div>
      </form>
    </div>
  );
};
