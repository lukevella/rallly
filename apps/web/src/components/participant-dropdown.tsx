import { trpc } from "@rallly/backend";
import {
  DotsHorizontalIcon,
  PencilIcon,
  TagIcon,
  TrashIcon,
} from "@rallly/icons";
import { useTranslation } from "next-i18next";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useMount } from "react-use";

import { Button } from "@/components/button";
import Dropdown, { DropdownItem } from "@/components/dropdown";
import Modal from "@/components/modal/modal";
import { useModalState } from "@/components/modal/use-modal";
import { useDeleteParticipantModal } from "@/components/poll/use-delete-participant-modal";
import { TextInput } from "@/components/text-input";
import { useFormValidation } from "@/utils/form-validation";
import { usePostHog } from "@/utils/posthog";

import { Participant } from ".prisma/client";

export const ParticipantDropdown = ({
  participant,
  onEdit,
  disabled,
}: {
  disabled?: boolean;
  participant: Participant;
  onEdit: () => void;
}) => {
  const { t } = useTranslation("app");
  const confirmDeleteParticipant = useDeleteParticipantModal();

  const [isChangeNameModalVisible, showChangeNameModal, hideChangeNameModal] =
    useModalState();

  return (
    <>
      <Dropdown
        placement="bottom-start"
        trigger={
          <Button data-testid="participant-menu">
            <DotsHorizontalIcon className="h-4 text-slate-500" />
          </Button>
        }
      >
        <DropdownItem
          disabled={disabled}
          icon={PencilIcon}
          onClick={onEdit}
          label={t("editVotes")}
        />
        <DropdownItem
          disabled={disabled}
          icon={TagIcon}
          onClick={showChangeNameModal}
          label={t("changeName")}
        />
        <DropdownItem
          disabled={disabled}
          icon={TrashIcon}
          onClick={() =>
            confirmDeleteParticipant(participant.id, participant.name)
          }
          label={t("delete")}
        />
      </Dropdown>
      <Modal
        showClose={true}
        overlayClosable={true}
        visible={isChangeNameModalVisible}
        onCancel={hideChangeNameModal}
        footer={null}
        content={
          <ChangeNameModal
            oldName={participant.name}
            onDone={hideChangeNameModal}
            participantId={participant.id}
          />
        }
      />
    </>
  );
};

type ChangeNameForm = {
  name: string;
};

const ChangeNameModal = (props: {
  oldName: string;
  participantId: string;
  onDone: () => void;
}) => {
  const posthog = usePostHog();
  const changeName = trpc.polls.participants.rename.useMutation({
    onSuccess: (_, { participantId, newName }) => {
      posthog?.capture("changed name", {
        participantId,
        oldName: props.oldName,
        newName,
      });
    },
  });
  const { register, handleSubmit, setFocus, formState } =
    useForm<ChangeNameForm>({
      defaultValues: {
        name: props.oldName,
      },
    });

  const { errors } = formState;

  useMount(() => {
    setFocus("name", {
      shouldSelect: true,
    });
  });

  const handler = React.useCallback<SubmitHandler<ChangeNameForm>>(
    async ({ name }) => {
      if (formState.isDirty) {
        // change name
        await changeName.mutateAsync({
          participantId: props.participantId,
          newName: name,
        });
      }
      props.onDone();
    },
    [changeName, formState.isDirty, props],
  );

  const { requiredString } = useFormValidation();

  const { t } = useTranslation("app");
  return (
    <form onSubmit={handleSubmit(handler)} className="max-w-sm space-y-3 p-4">
      <div>
        <div className="text-lg font-semibold text-slate-800">
          {t("changeName")}
        </div>
        <div>{t("changeNameDescription")}</div>
      </div>
      <fieldset>
        <label className="text-slate-500">{t("name")}</label>
        <TextInput
          className="w-full"
          error={!!errors.name}
          disabled={formState.isSubmitting}
          {...register("name", {
            validate: requiredString(t("name")),
          })}
        />
        {errors.name ? (
          <div className="text-sm text-rose-500">{errors.name.message}</div>
        ) : null}
        <div className="mt-2 text-sm text-slate-500">{t("changeNameInfo")}</div>
      </fieldset>
      <div className="flex gap-2 ">
        <Button disabled={formState.isSubmitting} onClick={props.onDone}>
          {t("cancel")}
        </Button>
        <Button
          loading={formState.isSubmitting}
          htmlType="submit"
          type="primary"
        >
          {t("save")}
        </Button>
      </div>
    </form>
  );
};
