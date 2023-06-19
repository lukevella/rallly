import { trpc } from "@rallly/backend";
import { CheckCircleIcon, MegaphoneIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import Link from "next/link";
import { Trans, useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";

import { Logo } from "@/components/logo";
import { useModalState } from "@/components/modal/use-modal";

const FeedbackForm = (props: { onClose: () => void }) => {
  const { t } = useTranslation();
  const sendFeedback = trpc.feedback.send.useMutation();
  const { handleSubmit, register, formState } = useForm<{ content: string }>();

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        await sendFeedback.mutateAsync(data);
      })}
      className="shadow-huge animate-popIn fixed bottom-8 right-8 z-20 w-[460px] max-w-full origin-bottom-right space-y-2 overflow-hidden rounded-md border bg-white p-3"
    >
      {formState.isSubmitted ? (
        <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-white">
          <div className="space-y-3 text-center">
            <CheckCircleIcon className="inline-block h-14 text-green-500" />
            <div>{t("feedbackSent")}</div>
            <div>
              <button onClick={props.onClose} className="text-link">
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="font-semibold text-gray-800">
        {t("feedbackFormTitle")}
      </div>
      <fieldset>
        <label className="mb-2" htmlFor="feedback">
          <Trans
            t={t}
            i18nKey="feedbackFormLabel"
            components={{ appname: <Logo /> }}
          />
        </label>
        <textarea
          id="feedback"
          autoFocus={true}
          placeholder={t("feedbackFormPlaceholder")}
          rows={4}
          className="w-full border bg-gray-50 p-2 text-gray-800"
          {...register("content", { required: true })}
        />
      </fieldset>
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button onClick={props.onClose}>{t("cancel")}</Button>
          <Button
            loading={formState.isSubmitting}
            type="submit"
            variant="primary"
          >
            {t("send")}
          </Button>
        </div>
        <div className="text-sm">
          <Trans
            t={t}
            i18nKey="feedbackFormFooter"
            components={{
              a: (
                <Link href="https://support.rallly.co" className="text-link" />
              ),
            }}
          />
        </div>
      </div>
    </form>
  );
};

const FeedbackButton = () => {
  const { t } = useTranslation();
  const [isVisible, show, close] = useModalState();
  if (isVisible) {
    return <FeedbackForm onClose={close} />;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={show}
          className="shadow-huge fixed bottom-8 right-8 hidden h-14 w-14 items-center justify-center rounded-full bg-gray-800 sm:inline-flex"
        >
          <MegaphoneIcon className="h-7 text-white" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{t("sendFeedback")}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default FeedbackButton;
