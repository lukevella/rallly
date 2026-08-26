"use client";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@rallly/ui/input-group";
import { MaxCharLength } from "@rallly/ui/max-char-length";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@rallly/ui/sheet";
import { toast } from "@rallly/ui/sonner";
import {
  ArrowUpIcon,
  CheckCircle2Icon,
  EyeIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  TrashIcon,
} from "lucide-react";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { usePoll, useRole } from "@/features/poll/client";
import { useEditToken } from "@/features/poll/components/mutations";
import {
  Participant,
  ParticipantName,
} from "@/features/poll/components/participant";
import { useParticipants } from "@/features/poll/components/participants-provider";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import {
  MAX_COMMENT_AUTHOR_NAME_LENGTH,
  MAX_COMMENT_LENGTH,
} from "@/features/poll/schema";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { RelativeTime } from "@/lib/datetime/relative-time";
import { requiredString } from "@/lib/utils/form-validation";
import { trpc } from "@/trpc/client";

interface CommentForm {
  authorName: string;
  content: string;
}

function NewCommentForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { t } = useTranslation();
  const poll = usePoll();
  const { user, createGuestIfNeeded } = useUser();
  const { participants } = useParticipants();

  const authorName = React.useMemo(() => {
    if (user) {
      if (!user.isGuest) {
        return user.name;
      }
      const participant = participants.find((p) => p.userId === user.id);
      return participant?.name ?? "";
    }
    return "";
  }, [user, participants]);

  const pollId = poll.id;

  const { register, reset, control, handleSubmit, formState, watch } =
    useForm<CommentForm>({
      defaultValues: {
        authorName,
        content: "",
      },
    });

  const contentLength = watch("content").length;

  const queryClient = trpc.useUtils();

  const addComment = trpc.polls.comments.add.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });
  return (
    <form
      className="w-full"
      onSubmit={handleSubmit(async ({ authorName, content }) => {
        await createGuestIfNeeded();
        await addComment.mutateAsync({ authorName, content, pollId });
        await queryClient.polls.comments.list.invalidate({ pollId });
        reset({ authorName, content: "" });
        onSubmitted();
      })}
    >
      <InputGroup>
        <InputGroupAddon align="block-start" className="border-b">
          {user && !user.isGuest ? (
            <>
              <OptimizedAvatarImage
                size="sm"
                src={user.image}
                name={user.name}
              />
              <InputGroupText>{user.name}</InputGroupText>
            </>
          ) : (
            <>
              <OptimizedAvatarImage size="sm" name={watch("authorName")} />
              <Controller
                name="authorName"
                key={user?.id}
                control={control}
                rules={{ validate: requiredString }}
                render={({ field }) => (
                  <InputGroupInput
                    placeholder={t("yourName")}
                    maxLength={MAX_COMMENT_AUTHOR_NAME_LENGTH}
                    data-1p-ignore="true"
                    aria-invalid={!!formState.errors.authorName}
                    {...field}
                  />
                )}
              />
            </>
          )}
        </InputGroupAddon>
        <InputGroupTextarea
          id="comment"
          maxLength={MAX_COMMENT_LENGTH}
          placeholder={t("commentsComposerPlaceholder", {
            defaultValue: "Write a comment…",
          })}
          aria-invalid={!!formState.errors.content}
          {...register("content", { validate: requiredString })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <InputGroupAddon align="block-end">
          <InputGroupText className="text-muted-foreground">
            <EyeIcon />
            <Trans
              i18nKey="commentsComposerVisibility"
              defaults="Visible to everyone"
            />
          </InputGroupText>
          <div className="ml-auto flex items-center gap-2">
            <MaxCharLength
              length={contentLength}
              maxLength={MAX_COMMENT_LENGTH}
              label={t("charactersRemaining", {
                defaultValue:
                  "{count, plural, one {# character remaining} other {# characters remaining}}",
                count: MAX_COMMENT_LENGTH - contentLength,
              })}
            />
            <InputGroupButton
              type="submit"
              size="icon-sm"
              variant="primary"
              aria-label={t("addComment", { defaultValue: "Add comment" })}
              loading={formState.isSubmitting}
            >
              <ArrowUpIcon />
            </InputGroupButton>
          </div>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

function CommentsSheetInner({ className }: { className?: string }) {
  const { t } = useTranslation();
  const poll = usePoll();
  const dialog = useDialog();

  const pollId = poll.id;
  const token = useEditToken();

  const { data: comments } = trpc.polls.comments.list.useQuery({ pollId });

  const queryClient = trpc.useUtils();

  const deleteComment = trpc.polls.comments.delete.useMutation({
    onMutate: ({ commentId }) => {
      const previousComments = queryClient.polls.comments.list.getData({
        pollId,
      });
      queryClient.polls.comments.list.setData(
        { pollId },
        (existingComments = []) => {
          return existingComments.filter(({ id }) => id !== commentId);
        },
      );
      return { previousComments };
    },
    onError: (_error, _variables, context) => {
      queryClient.polls.comments.list.setData(
        { pollId },
        context?.previousComments,
      );
    },
    onSettled: () => {
      queryClient.polls.comments.list.invalidate({ pollId });
    },
  });

  const session = useUser();

  const role = useRole();

  const [hasCommented, setHasCommented] = React.useState(false);

  const count = comments?.length ?? 0;

  const sortedComments = React.useMemo(
    () =>
      comments
        ? [...comments].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
        : [],
    [comments],
  );

  return (
    <>
      <Button className={className} size="lg" onClick={() => dialog.trigger()}>
        <MessageCircleIcon data-icon="inline-start" />
        <Trans
          i18nKey="commentsTriggerLabel"
          defaults="{count, plural, =0 {Comments} one {1 Comment} other {# Comments}}"
          values={{ count }}
        />
      </Button>
      <Sheet {...dialog.dialogProps}>
        <SheetContent className="flex flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              <Trans i18nKey="comments" defaults="Comments" />
            </SheetTitle>
            <SheetDescription className="sr-only">
              <Trans
                i18nKey="commentsSheetDescription"
                defaults="View and add comments on this poll"
              />
            </SheetDescription>
          </SheetHeader>
          {!poll.event ? (
            <div className="pb-4">
              {hasCommented ? (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-muted-foreground text-sm">
                  <CheckCircle2Icon className="size-4 text-green-600 dark:text-green-500" />
                  <Trans
                    i18nKey="commentsSheetSubmitted"
                    defaults="Your comment has been added"
                  />
                </div>
              ) : (
                <NewCommentForm onSubmitted={() => setHasCommented(true)} />
              )}
            </div>
          ) : null}
          <div className="-mx-6 -mb-6 flex grow flex-col overflow-y-auto border-t px-6 pt-4">
            <div className="flex grow flex-col pb-6">
              {count > 0 ? (
                <div className="divide-y">
                  {sortedComments.map((comment) => {
                    const canDelete =
                      role === "admin" || session.ownsObject(comment);

                    return (
                      <div
                        data-testid="comment"
                        key={comment.id}
                        className="py-4 first:pt-0 last:pb-0"
                      >
                        <div className="mb-1 flex items-center space-x-2 text-muted-foreground dark:text-muted-foreground/75">
                          <Participant>
                            <OptimizedAvatarImage
                              name={comment.authorName}
                              size="sm"
                            />
                            <ParticipantName>
                              {comment.authorName}
                            </ParticipantName>
                            {session.ownsObject(comment) ? (
                              <Badge>
                                <Trans i18nKey="you" />
                              </Badge>
                            ) : null}
                          </Participant>
                          {canDelete && (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    className="ml-auto"
                                    aria-label={t("moreOptions", {
                                      defaultValue: "More options",
                                    })}
                                    variant="ghost"
                                    size="icon-xs"
                                  />
                                }
                              >
                                <MoreHorizontalIcon />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => {
                                    deleteComment.mutate({
                                      commentId: comment.id,
                                      token,
                                    });
                                  }}
                                >
                                  <TrashIcon />
                                  <Trans i18nKey="delete" />
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <div className="w-fit whitespace-pre-wrap pl-8 text-foreground text-sm leading-relaxed">
                          <TruncatedLinkify>{comment.content}</TruncatedLinkify>
                        </div>
                        <div className="mt-1 pl-8 text-muted-foreground text-xs dark:text-muted-foreground/75">
                          <RelativeTime value={comment.createdAt} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex grow flex-col items-center justify-center gap-2 text-center">
                  <MessageCircleIcon className="size-5 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    <Trans
                      i18nKey="commentsSheetEmpty"
                      defaults="No comments yet"
                    />
                  </p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function CommentsSheet({ className }: { className?: string }) {
  const poll = usePoll();
  if (poll.disableComments) {
    return null;
  }
  return <CommentsSheetInner className={className} />;
}
