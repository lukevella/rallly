import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Icon } from "@rallly/ui/icon";
import { Input } from "@rallly/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import { PencilIcon, TagIcon, TrashIcon } from "lucide-react";
import React from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useMount } from "react-use";
import * as z from "zod";

import {
  useDeleteParticipantMutation,
  useEditToken,
} from "@/features/poll/components/mutations";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import { Trans, useTranslation } from "@/i18n/client";
import { useFormValidation } from "@/lib/utils/form-validation";
import { trpc } from "@/trpc/client";

export const ParticipantPopover = ({
  participant,
  onEdit,
  children,
  disabled,
  align,
}: {
  /** Hides the actions; the popover still opens to show details and the note. */
  disabled?: boolean;
  participant: {
    name: string;
    userId?: string;
    email?: string;
    note?: string;
    id: string;
  };
  align?: "start" | "end";
  onEdit: () => void;
  children: React.ReactElement;
}) => {
  const [open, setOpen] = React.useState(false);
  const [isChangeNameModalVisible, setIsChangeNameModalVisible] =
    React.useState(false);
  const [isDeleteParticipantModalVisible, setIsDeleteParticipantModalVisible] =
    React.useState(false);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled && !participant.note}
          data-testid="participant-menu"
          render={children}
        />
        <PopoverContent align={align} className="gap-2 p-2">
          <div className="grid gap-0.5 px-2 pt-1.5">
            <div className="font-medium text-foreground text-sm">
              {participant.name}
            </div>
            {participant.email ? (
              <div className="text-muted-foreground text-xs">
                {participant.email}
              </div>
            ) : null}
          </div>
          {participant.note ? (
            <div className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words px-2 pb-0.5 text-sm">
              <TruncatedLinkify>{participant.note}</TruncatedLinkify>
            </div>
          ) : null}
          {!disabled ? (
            <>
              <div className="-mx-2 h-px bg-border" />
              <div className="grid gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    setOpen(false);
                    onEdit();
                  }}
                >
                  <Icon>
                    <PencilIcon />
                  </Icon>
                  <Trans i18nKey="editVotes" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    setOpen(false);
                    setIsChangeNameModalVisible(true);
                  }}
                >
                  <Icon>
                    <TagIcon />
                  </Icon>
                  <Trans i18nKey="changeName" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-destructive hover:text-destructive"
                  onClick={() => {
                    setOpen(false);
                    setIsDeleteParticipantModalVisible(true);
                  }}
                >
                  <Icon>
                    <TrashIcon />
                  </Icon>
                  <Trans i18nKey="delete" />
                </Button>
              </div>
            </>
          ) : null}
        </PopoverContent>
      </Popover>

      <ChangeNameModal
        open={isChangeNameModalVisible}
        onOpenChange={setIsChangeNameModalVisible}
        oldName={participant.name}
        participantId={participant.id}
      />
      <DeleteParticipantModal
        open={isDeleteParticipantModalVisible}
        onOpenChange={setIsDeleteParticipantModalVisible}
        participantId={participant.id}
        participantName={participant.name}
      />
    </>
  );
};

const DeleteParticipantModal = ({
  open,
  onOpenChange,
  participantId,
  participantName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantId: string;
  participantName: string;
}) => {
  const deleteParticipant = useDeleteParticipantMutation();
  const token = useEditToken();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans
              i18nKey="deleteParticipant"
              values={{ name: participantName }}
            />
          </DialogTitle>
          <DialogDescription>
            <Trans i18nKey="deleteParticipantDescription" />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => {
              onOpenChange(false);
            }}
          >
            <Trans i18nKey="cancel" />
          </Button>
          <Button
            loading={deleteParticipant.isPending}
            variant="destructive"
            onClick={async () => {
              deleteParticipant.mutate({
                participantId,
                token,
              });
              onOpenChange(false);
            }}
          >
            <Trans i18nKey="delete" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type ChangeNameForm = {
  name: string;
};

const changeNameSchema = z.object({
  name: z.string().trim().min(1),
});

const ChangeNameModal = (props: {
  oldName: string;
  participantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const token = useEditToken();
  const changeName = trpc.polls.participants.rename.useMutation();
  const form = useForm({
    defaultValues: {
      name: props.oldName,
    },
    resolver: zodResolver(changeNameSchema),
  });

  const { control, reset, handleSubmit, setFocus, formState } = form;

  useMount(() => {
    setFocus("name", {
      shouldSelect: true,
    });
  });

  const { participantId, onOpenChange } = props;

  const handler = React.useCallback<SubmitHandler<ChangeNameForm>>(
    async ({ name }) => {
      if (formState.isDirty) {
        // change name
        await changeName.mutateAsync({
          participantId,
          newName: name,
          token,
        });
      }
      onOpenChange(false);
    },
    [changeName, formState.isDirty, participantId, token, onOpenChange],
  );

  const { requiredString } = useFormValidation();
  const formName = `change-name-${props.participantId}`;
  const { t } = useTranslation();
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("changeName")}</DialogTitle>
          <DialogDescription>{t("changeNameDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id={formName} onSubmit={handleSubmit(handler)}>
            <FormField
              control={control}
              name="name"
              rules={{
                validate: requiredString(t("name")),
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      className="w-full"
                      {...field}
                      disabled={formState.isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>{t("changeNameInfo")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            disabled={formState.isSubmitting}
            onClick={() => {
              reset();
              props.onOpenChange(false);
            }}
          >
            {t("cancel")}
          </Button>
          <Button
            form={formName}
            loading={formState.isSubmitting}
            type="submit"
            variant="primary"
          >
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
