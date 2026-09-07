import { zodResolver } from "@hookform/resolvers/zod";
import { posthog } from "@rallly/posthog/client";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { toast } from "@rallly/ui/sonner";
import { LinkIcon, PencilIcon, TagIcon, TrashIcon } from "lucide-react";
import React from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useCopyToClipboard, useMount } from "react-use";
import * as z from "zod";

import { usePoll } from "@/features/poll/client";
import {
  useDeleteParticipantMutation,
  useEditToken,
} from "@/features/poll/components/mutations";
import { Trans, useTranslation } from "@/i18n/client";
import { useFormValidation } from "@/lib/utils/form-validation";
import { trpc } from "@/trpc/client";

export const ParticipantDropdown = ({
  participant,
  onEdit,
  onDelete,
  children,
  disabled,
  align,
}: {
  disabled?: boolean;
  participant: {
    name: string;
    userId?: string;
    email?: string;
    id: string;
    // Present only in the host's list; its presence is the gate.
    editUrl?: string | null;
  };
  align?: "start" | "end";
  onEdit: () => void;
  onDelete?: () => void;
  children: React.ReactElement;
}) => {
  const [isChangeNameModalVisible, setIsChangeNameModalVisible] =
    React.useState(false);
  const [isDeleteParticipantModalVisible, setIsDeleteParticipantModalVisible] =
    React.useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          disabled={disabled}
          data-testid="participant-menu"
          render={children}
        />
        <DropdownMenuContent align={align}>
          <DropdownMenuLabel>
            <div className="grid gap-0.5">
              <div className="font-medium text-foreground">
                {participant.name}
              </div>
              {participant.email ? (
                <div className="font-normal text-muted-foreground text-xs">
                  {participant.email}
                </div>
              ) : null}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onEdit}>
            <PencilIcon />
            <Trans i18nKey="editVotes" defaults="Edit votes" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsChangeNameModalVisible(true)}>
            <TagIcon />
            <Trans i18nKey="changeName" defaults="Change name" />
          </DropdownMenuItem>
          {participant.editUrl ? (
            <CopyEditLinkMenuItem
              editUrl={participant.editUrl}
              participantName={participant.name}
            />
          ) : null}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setIsDeleteParticipantModalVisible(true)}
          >
            <TrashIcon />
            <Trans i18nKey="delete" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
        onDelete={onDelete}
      />
    </>
  );
};

/**
 * The per response edit link, for handing edit access to someone who
 * responded without an email (or lost the confirmation email).
 */
const CopyEditLinkMenuItem = ({
  editUrl,
  participantName,
}: {
  editUrl: string;
  participantName: string;
}) => {
  const poll = usePoll();
  const { t } = useTranslation();
  const [state, copyToClipboard] = useCopyToClipboard();

  // react-use records a failed copy as `error` and a successful one as
  // `value`; the toast only claims success in the second case.
  React.useEffect(() => {
    if (state.error) {
      console.error(`Unable to copy value: ${state.error.message}`);
      toast.error(
        t("participantEditLinkCopyFailed", {
          defaultValue: "Couldn't copy the edit link. Try again.",
        }),
      );
      return;
    }
    if (state.value) {
      toast(
        t("participantEditLinkCopied", {
          defaultValue: "Edit link for {name} copied",
          name: participantName,
        }),
      );
      posthog?.capture("poll_page:participant_edit_link_copy", {
        poll_id: poll.id,
      });
    }
  }, [state, participantName, poll.id, t]);

  return (
    <DropdownMenuItem onClick={() => copyToClipboard(editUrl)}>
      <LinkIcon />
      <Trans i18nKey="copyEditLink" defaults="Copy edit link" />
    </DropdownMenuItem>
  );
};

const DeleteParticipantModal = ({
  open,
  onOpenChange,
  participantId,
  participantName,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantId: string;
  participantName: string;
  onDelete?: () => void;
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
              defaults="Delete {name}?"
              values={{ name: participantName }}
            />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="deleteParticipantDescription"
              defaults="Are you sure you want to delete this participant? This action cannot be undone."
            />
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
              onDelete?.();
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
          <DialogTitle>
            {t("changeName", { defaultValue: "Change name" })}
          </DialogTitle>
          <DialogDescription>
            {t("changeNameDescription", {
              defaultValue: "Enter a new name for this participant.",
            })}
          </DialogDescription>
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
                  <FormDescription>
                    {t("changeNameInfo", {
                      defaultValue:
                        "This will not affect any votes you have already made.",
                    })}
                  </FormDescription>
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
