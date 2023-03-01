import clsx from "clsx";
import { Trans, useTranslation } from "next-i18next";
import posthog from "posthog-js";
import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/button";
import Exclamation from "@/components/icons/exclamation.svg";

import { trpc } from "../../../utils/trpc";

const confirmText = "delete-me";

export const DeletePollForm: React.FunctionComponent<{
  onCancel: () => void;
  onConfirm: () => void;
  urlId: string;
}> = ({ onCancel, onConfirm, urlId }) => {
  const { register, handleSubmit, formState, watch } = useForm<{
    confirmation: string;
  }>();

  const confirmationText = watch("confirmation");
  const canDelete = confirmationText === confirmText;
  const deletePoll = trpc.polls.delete.useMutation({
    onSuccess: () => {
      posthog.capture("deleted poll");
    },
  });

  const { t } = useTranslation("app");

  return (
    <div className="flex max-w-lg space-x-6 p-5">
      <div className="">
        <div className="rounded-full bg-rose-100 p-3">
          <Exclamation className="w-8 text-rose-500" />
        </div>
      </div>
      <form
        data-testid="delete-poll-form"
        onSubmit={handleSubmit(async () => {
          await deletePoll.mutateAsync({ urlId });
          onConfirm();
        })}
      >
        <div className="mb-3 text-xl font-medium text-slate-800">
          {t("areYouSure")}
        </div>
        <p className="text-slate-500">
          <Trans
            t={t}
            i18nKey="deletePollDescription"
            values={{ confirmText }}
            components={{
              s: <span className="whitespace-nowrap font-mono" />,
            }}
          />
        </p>
        <div className="mb-6">
          <input
            type="text"
            className={clsx("input w-full", {
              "input-error": formState.errors.confirmation,
            })}
            placeholder={confirmText}
            {...register("confirmation", {
              validate: (value) => value === confirmText,
            })}
            readOnly={formState.isSubmitting}
          />
        </div>
        <div className="flex space-x-3">
          <Button onClick={onCancel}>{t("cancel")}</Button>
          <Button
            disabled={!canDelete}
            htmlType="submit"
            type="danger"
            loading={formState.isSubmitting}
          >
            {t("deletePoll")}
          </Button>
        </div>
      </form>
    </div>
  );
};
