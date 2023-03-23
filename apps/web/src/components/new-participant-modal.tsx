import { VoteType } from "@rallly/database";
import clsx from "clsx";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import { useMount } from "react-use";

import InformationCircle from "@/components/icons/information-circle.svg";
import Tooltip from "@/components/tooltip";
import { useUser } from "@/components/user-provider";

import { useFormValidation } from "../utils/form-validation";
import { Button } from "./button";
import { useModalContext } from "./modal/modal-provider";
import { useAddParticipantMutation } from "./poll/mutations";
import VoteIcon from "./poll/vote-icon";
import { usePoll } from "./poll-context";
import { TextInput } from "./text-input";

interface NewParticipantFormData {
  name: string;
  email?: string;
}

interface NewParticipantModalProps {
  votes: { optionId: string; type: VoteType }[];
  onSubmit?: (data: { id: string }) => void;
  onCancel?: () => void;
}

const VoteSummary = ({
  votes,
  className,
}: {
  className?: string;
  votes: { optionId: string; type: VoteType }[];
}) => {
  const { t } = useTranslation("app");
  const voteByType = votes.reduce<Record<VoteType, string[]>>(
    (acc, vote) => {
      acc[vote.type] = [...acc[vote.type], vote.optionId];
      return acc;
    },
    { yes: [], ifNeedBe: [], no: [] },
  );

  const voteTypes = Object.keys(voteByType) as VoteType[];

  return (
    <div
      className={clsx(
        "flex flex-wrap gap-1.5 rounded border bg-gray-50 p-1.5",
        className,
      )}
    >
      {voteTypes.map((voteType) => {
        const votes = voteByType[voteType];
        const count = votes.length;
        if (count === 0) {
          return null;
        }
        return (
          <div
            key={voteType}
            className="flex h-8 select-none divide-x rounded border bg-gray-50 text-sm"
          >
            <div className="flex items-center gap-2 pl-2 pr-3">
              <VoteIcon type={voteType} />
              <div>{t(voteType)}</div>
            </div>
            <div className="flex h-full items-center justify-center px-2 text-sm font-semibold text-slate-800">
              {voteByType[voteType].length}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const NewParticipantModal = (props: NewParticipantModalProps) => {
  const { t } = useTranslation("app");
  const { user } = useUser();
  const { register, formState, setFocus, handleSubmit } =
    useForm<NewParticipantFormData>({
      defaultValues: !user.isGuest
        ? { name: user.name, email: user.email }
        : { name: "", email: "" },
    });

  const { requiredString, validEmail } = useFormValidation();
  const { poll } = usePoll();
  const addParticipant = useAddParticipantMutation();

  useMount(() => {
    setFocus("name", { shouldSelect: true });
  });

  return (
    <div className="max-w-full p-4">
      <div className="text-lg font-semibold text-slate-800">
        {t("newParticipant")}
      </div>
      <div className="mb-4">{t("newParticipantFormDescription")}</div>
      <form
        onSubmit={handleSubmit(async (data) => {
          const newParticipant = await addParticipant.mutateAsync({
            name: data.name,
            votes: props.votes,
            email: data.email,
            pollId: poll.id,
          });
          props.onSubmit?.(newParticipant);
        })}
        className="space-y-3"
      >
        <fieldset>
          <label htmlFor="name" className="text-slate-500">
            {t("name")}
          </label>
          <TextInput
            className="w-full"
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
        <fieldset>
          <label htmlFor="email" className="text-slate-500">
            <span>
              {t("email")} ({t("optional")})
            </span>
            <Tooltip
              content={
                <div className="max-w-sm">
                  {t("newParticipantEmailTooltip")}
                </div>
              }
            >
              <InformationCircle className="ml-1 inline-block h-5 text-slate-400" />
            </Tooltip>
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
        <fieldset>
          <label className="text-slate-500">{t("response")}</label>
          <VoteSummary votes={props.votes} />
        </fieldset>
        <div className="flex gap-2">
          <Button onClick={props.onCancel}>{t("cancel")}</Button>
          <Button
            htmlType="submit"
            type="primary"
            loading={formState.isSubmitting}
          >
            {t("submit")}
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
      showClose: true,
      overlayClosable: true,
      content: function Content({ close }) {
        return (
          <NewParticipantModal
            {...props}
            onSubmit={(data) => {
              props.onSubmit?.(data);
              close();
            }}
            onCancel={close}
          />
        );
      },
      footer: null,
    });
  };

  return showNewParticipantModal;
};
