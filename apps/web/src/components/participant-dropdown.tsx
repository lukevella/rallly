import { trpc } from "@rallly/backend";
import { PencilIcon, TagIcon, TrashIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIconLabel,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { useTranslation } from "next-i18next";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useMount } from "react-use";

import Modal from "@/components/modal/modal";
import { useModalState } from "@/components/modal/use-modal";
import { useDeleteParticipantModal } from "@/components/poll/use-delete-participant-modal";
import { TextInput } from "@/components/text-input";
import { Trans } from "@/components/trans";
import { useFormValidation } from "@/utils/form-validation";
import { usePostHog } from "@/utils/posthog";

import { Participant } from ".prisma/client";

export const ParticipantDropdown = ({
  participant,
  onEdit,
  children,
  disabled,
  align,
}: {
  disabled?: boolean;
  participant: Participant;
  align?: "start" | "end";
  onEdit: () => void;
  children: React.ReactNode;
}) => {
  const confirmDeleteParticipant = useDeleteParticipantModal();

  const [isChangeNameModalVisible, showChangeNameModal, hideChangeNameModal] =
    useModalState();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          asChild={true}
          data-testid="participant-menu"
        >
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          <DropdownMenuItem onClick={onEdit}>
            <DropdownMenuItemIconLabel icon={PencilIcon}>
              <Trans i18nKey="editVotes" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={showChangeNameModal}>
            <DropdownMenuItemIconLabel icon={TagIcon}>
              <Trans i18nKey="changeName" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              confirmDeleteParticipant(participant.id, participant.name)
            }
          >
            <DropdownMenuItemIconLabel icon={TrashIcon}>
              <Trans i18nKey="delete" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
  const queryClient = trpc.useContext();
  const changeName = trpc.polls.participants.rename.useMutation({
    onSuccess: (_, { participantId, newName }) => {
      queryClient.polls.participants.invalidate();
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

  const { t } = useTranslation();
  return (
    <form onSubmit={handleSubmit(handler)} className="max-w-sm space-y-3 p-4">
      <div>
        <div className="text-lg font-semibold text-gray-800">
          {t("changeName")}
        </div>
        <div>{t("changeNameDescription")}</div>
      </div>
      <fieldset>
        <label className="mb-1 text-gray-500">{t("name")}</label>
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
        <div className="mt-2 text-sm text-gray-500">{t("changeNameInfo")}</div>
      </fieldset>
      <div className="flex gap-2 ">
        <Button disabled={formState.isSubmitting} onClick={props.onDone}>
          {t("cancel")}
        </Button>
        <Button
          loading={formState.isSubmitting}
          type="submit"
          variant="primary"
        >
          {t("save")}
        </Button>
      </div>
    </form>
  );
};
