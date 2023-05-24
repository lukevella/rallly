import { trpc } from "@rallly/backend";
import { ExclamationIcon } from "@rallly/icons";
import clsx from "clsx";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/button";
import { usePostHog } from "@/utils/posthog";

const confirmText = "delete-me";

export const DeletePollForm: React.FunctionComponent<{
  onCancel: () => void;
  urlId: string;
}> = ({ onCancel, urlId }) => {
  const { register, handleSubmit, formState, watch } = useForm<{
    confirmation: string;
  }>();

  const confirmationText = watch("confirmation");
  const canDelete = confirmationText === confirmText;
  const posthog = usePostHog();
  const queryClient = trpc.useContext();
  const deletePoll = trpc.polls.delete.useMutation({
    onSuccess: () => {
      queryClient.polls.invalidate();
      posthog?.capture("deleted poll");
    },
  });

  const router = useRouter();

  const { t } = useTranslation();

  return (
    <div className="flex max-w-lg space-x-6 p-5">
      <div className="">
        <div className="rounded-full bg-rose-100 p-3">
          <ExclamationIcon className="w-8 text-rose-500" />
        </div>
      </div>
      <form
        data-testid="delete-poll-form"
        onSubmit={handleSubmit(async () => {
          await deletePoll.mutateAsync({ urlId });
          router.push("/polls");
        })}
      >
        <div className="mb-3 text-xl font-medium text-gray-800">
          {t("areYouSure")}
        </div>
        <p className="text-gray-500">
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
