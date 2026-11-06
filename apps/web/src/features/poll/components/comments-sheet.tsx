"use client";
import { cn, passwordManagerIgnoreProps } from "@rallly/ui";
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
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import {
  useComments,
  useParticipants,
  usePoll,
  useRole,
} from "@/features/poll/client";
import {
  useAddComment,
  useDeleteComment,
} from "@/features/poll/components/mutations";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import {
  MAX_COMMENT_AUTHOR_NAME_LENGTH,
  MAX_COMMENT_LENGTH,
} from "@/features/poll/schema";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { RelativeTime } from "@/lib/datetime/relative-time";
import { requiredString } from "@/lib/utils/form-validation";

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

  const addComment = useAddComment();

  const getCommentErrorMessage = (reason: string) => {
    switch (reason) {
      case "disabled":
      case "notFound":
        return t("commentsDisabledError", {
          defaultValue: "Comments are turned off for this poll.",
        });
      case "tooManyRequests":
        return t("actionErrorTooManyRequests", {
          defaultValue: "You are making too many requests",
        });
      case "sessionUnavailable":
        return t("guestSessionUnavailableError", {
          defaultValue:
            "We couldn't start a session for you. Check that cookies are enabled and try again.",
        });
      default:
        return t("actionErrorInternalServerError", {
          defaultValue: "An internal server error occurred",
        });
    }
  };

  return (
    <form
      className="w-full"
      onSubmit={handleSubmit(async ({ authorName, content }) => {
        const session = await createGuestIfNeeded();
        if (!session.ok) {
          toast.error(getCommentErrorMessage(session.reason));
          return;
        }
        const result = await addComment.execute({
          authorName,
          content,
          pollId,
        });
        if (!result.ok) {
          toast.error(getCommentErrorMessage(result.reason));
          return;
        }
        reset({ authorName, content: "" });
        onSubmitted();
      })}
    >
      <InputGroup className="bg-card">
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
                    {...passwordManagerIgnoreProps}
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
          className="max-h-40 min-h-9"
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
          <InputGroupText className="text-muted-foreground text-xs">
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

/**
 * The composer, or a confirmation once a comment is added. Nothing once the
 * poll is scheduled: discussion is closed by then.
 */
export function CommentComposer() {
  const poll = usePoll();
  const [hasCommented, setHasCommented] = React.useState(false);

  if (poll.event) {
    return null;
  }

  if (hasCommented) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-muted-foreground text-sm">
        <CheckCircle2Icon className="size-4 text-green-600 dark:text-green-500" />
        <Trans
          i18nKey="commentsSheetSubmitted"
          defaults="Your comment has been added"
        />
      </div>
    );
  }

  return <NewCommentForm onSubmitted={() => setHasCommented(true)} />;
}

/**
 * Every comment, or an empty state. Newest first suits a composer above the
 * list; oldest first reads as a conversation with the composer below.
 */
export function CommentList({
  className,
  order = "newest",
}: {
  className?: string;
  order?: "newest" | "oldest";
}) {
  const { t } = useTranslation();
  const comments = useComments();
  const deleteComment = useDeleteComment();
  const session = useUser();
  const role = useRole();

  const sortedComments = React.useMemo(
    () =>
      [...comments].sort((a, b) => {
        const diff =
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return order === "newest" ? diff : -diff;
      }),
    [comments, order],
  );

  if (sortedComments.length === 0) {
    return (
      <EmptyState className={cn("grow", className)}>
        <EmptyStateIcon>
          <MessageCircleIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="commentsSheetEmpty" defaults="No comments yet" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="commentsSheetEmptyDescription"
            defaults="Be the first to share your thoughts on this poll."
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      {sortedComments.map((comment) => {
        const canDelete = role === "admin" || session.ownsObject(comment);

        return (
          <div
            data-testid="comment"
            key={comment.id}
            className="flex items-start gap-x-2.5"
          >
            <OptimizedAvatarImage
              name={comment.authorName}
              size="sm"
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              {/* The bubble's flat top corner points at the avatar. */}
              <div className="relative w-fit max-w-full rounded-2xl rounded-tl-sm border border-primary/15 bg-primary/10 px-3.5 py-2.5">
                {canDelete && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          // Out of flow: the menu mounts focus-guard spans
                          // into the bubble, which would shift an in-flow
                          // trigger while open.
                          className="absolute top-1.5 right-1.5 text-muted-foreground"
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
                        disabled={deleteComment.isPending}
                        onClick={async () => {
                          const result = await deleteComment.execute({
                            commentId: comment.id,
                          });
                          if (!result.ok) {
                            toast.error(
                              t("actionErrorInternalServerError", {
                                defaultValue:
                                  "An internal server error occurred",
                              }),
                            );
                          }
                        }}
                      >
                        <TrashIcon />
                        <Trans i18nKey="delete" />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <div className="whitespace-pre-wrap pr-6 text-foreground text-sm leading-relaxed">
                  <TruncatedLinkify>{comment.content}</TruncatedLinkify>
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-x-1.5 pl-3.5 text-muted-foreground text-xs dark:text-muted-foreground/75">
                <span className="font-medium text-foreground">
                  {comment.authorName}
                </span>
                {session.ownsObject(comment) ? (
                  <Badge>
                    <Trans i18nKey="you" />
                  </Badge>
                ) : null}
                <span aria-hidden="true">·</span>
                <RelativeTime value={comment.createdAt} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommentsSheetInner({ className }: { className?: string }) {
  const poll = usePoll();
  const dialog = useDialog();
  const comments = useComments();
  const count = comments.length;

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
        <SheetContent className="flex flex-col p-4 sm:max-w-md sm:p-6">
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
              <CommentComposer />
            </div>
          ) : null}
          <div className="-mx-4 -mb-4 flex grow flex-col overflow-y-auto border-t px-4 pt-4 sm:-mx-6 sm:-mb-6 sm:px-6">
            <div className="flex grow flex-col pb-4 sm:pb-6">
              <CommentList />
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
