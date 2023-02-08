import { VoteType } from "@prisma/client";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";

import { useFormValidation } from "../utils/form-validation";
import { Button } from "./button";
import { useModalContext } from "./modal/modal-provider";
import { useAddParticipantMutation } from "./poll/mutations";
import { usePoll } from "./poll-context";
import { TextInput } from "./text-input";

interface NewParticipantFormData {
  name: string;
  email?: string;
}

interface NewParticipantModalProps {
  votes: { optionId: string; type: VoteType }[];
  onSubmit?: (data: NewParticipantFormData) => void;
}
export const NewParticipantModal = (props: NewParticipantModalProps) => {
  const { t } = useTranslation("app");
  const { register, formState, handleSubmit } =
    useForm<NewParticipantFormData>();
  const { requiredString, validEmail } = useFormValidation();
  const { poll } = usePoll();
  const addParticipant = useAddParticipantMutation();

  return (
    <div className="w-96 max-w-full p-4">
      <div className="text-lg font-semibold text-slate-800">
        {t("newParticipant")}
      </div>
      <div className="mb-4">{t("newParticipantFormDescription")}</div>
      <form
        onSubmit={handleSubmit(async (data) => {
          await addParticipant.mutateAsync({
            name: data.name,
            votes: props.votes,
            pollId: poll.id,
          });
          props.onSubmit?.(data);
        })}
      >
        <fieldset className="mb-4">
          <label htmlFor="name" className="text-slate-500">
            {t("name")}
          </label>
          <TextInput
            className="w-full"
            autoFocus={true}
            error={!!formState.errors.name}
            disabled={formState.isSubmitting}
            placeholder={t("namePlaceholder")}
            {...register("name", { validate: requiredString(t("name")) })}
          />
          {formState.errors.name?.message ? (
            <div className="mt-2 text-sm text-rose-500">
              {formState.errors.name.message}
            </div>
          ) : null}
        </fieldset>
        <fieldset className="mb-4">
          <label htmlFor="email" className="text-slate-500">
            {t("email")} ({t("optional")})
          </label>
          <TextInput
            className="w-full"
            error={!!formState.errors.email}
            disabled={formState.isSubmitting}
            placeholder={t("emailPlaceholder")}
            {...register("email", {
              validate: (value) => {
                if (!value) return true;
                return validEmail(value);
              },
            })}
          />
          {formState.errors.email?.message ? (
            <div className="mt-1 text-sm text-rose-500">
              {formState.errors.email.message}
            </div>
          ) : null}
        </fieldset>
        <div className="flex gap-2">
          <Button>{t("cancel")}</Button>
          <Button htmlType="submit" type="primary">
            {t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export const useNewParticipantModal = () => {
  const modalContext = useModalContext();

  const showNewParticipantModal = (props: NewParticipantModalProps) => {
    return modalContext.render({
      content: function Content({ close }) {
        return (
          <NewParticipantModal
            {...props}
            onSubmit={(data) => {
              props.onSubmit?.(data);
              close();
            }}
          />
        );
      },
      footer: null,
    });
  };

  return showNewParticipantModal;
};
