"use client";

import { posthog } from "@rallly/posthog/client";
import { passwordManagerIgnoreProps } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@rallly/ui/input-group";
import { MaxCharLength } from "@rallly/ui/max-char-length";
import { toast } from "@rallly/ui/sonner";
import {
  ArrowUpIcon,
  CheckCircle2Icon,
  EyeIcon,
  MessageCircleIcon,
  TrashIcon,
} from "lucide-react";
import * as React from "react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import {
  addCommentAction,
  deleteCommentAction,
} from "@/features/poll/comment/actions";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import { ensureSession, runBallotAction } from "@/features/poll/invite/client";
import {
  MAX_COMMENT_AUTHOR_NAME_LENGTH,
  MAX_COMMENT_LENGTH,
} from "@/features/poll/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { RelativeTime } from "@/lib/datetime/relative-time";
import { InviteSheet } from "./invite-sheet";

type VoteComment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: Date;
  isOwn: boolean;
  canDelete: boolean;
};

function useCommentErrorMessage() {
  const { t } = useTranslation();
  return (reason: string) => {
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
}

/** The header's comments button, its count, and the sheet it opens. */
export function VoteCommentsSheet({
  pollId,
  count,
  children,
}: {
  pollId: string;
  count: number;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <InviteSheet
      label={t("commentsTriggerLabel", {
        defaultValue:
          "{count, plural, =0 {Comments} one {1 Comment} other {# Comments}}",
        count,
      })}
      icon={
        <span className="relative">
          <MessageCircleIcon />
          {count > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-medium text-[0.625rem] text-primary-foreground tabular-nums leading-none"
            >
              {count > 99 ? "99+" : count}
            </span>
          ) : null}
        </span>
      }
      title={<Trans i18nKey="comments" defaults="Comments" />}
      className="sm:max-w-md"
      onOpen={() =>
        posthog?.capture("poll_vote:comments_open", {
          poll_id: pollId,
          comment_count: count,
        })
      }
    >
      {children}
    </InviteSheet>
  );
}

function NewCommentForm({
  pollId,
  signedInName,
  defaultName,
  onSubmitted,
}: {
  pollId: string;
  /** A signed-in viewer comments under their account name. */
  signedInName?: string;
  defaultName?: string;
  onSubmitted: () => void;
}) {
  const { t } = useTranslation();
  const getErrorMessage = useCommentErrorMessage();
  const [authorName, setAuthorName] = React.useState(defaultName ?? "");
  const [content, setContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const name = signedInName ?? authorName;

  return (
    <form
      className="w-full"
      onSubmit={async (event) => {
        event.preventDefault();
        if (isSubmitting || !name.trim() || !content.trim()) return;
        setIsSubmitting(true);
        try {
          const session = await ensureSession();
          if (!session.ok) {
            toast.error(getErrorMessage(session.reason));
            return;
          }
          const result = await runBallotAction(() =>
            addCommentAction({
              pollId,
              authorName: name.trim().slice(0, MAX_COMMENT_AUTHOR_NAME_LENGTH),
              content,
            }),
          );
          if (!result.ok) {
            toast.error(getErrorMessage(result.reason));
            return;
          }
          setContent("");
          onSubmitted();
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <InputGroup>
        <InputGroupAddon align="block-start" className="border-b">
          <OptimizedAvatarImage size="sm" name={name} />
          {signedInName ? (
            <InputGroupText>{signedInName}</InputGroupText>
          ) : (
            <InputGroupInput
              required
              aria-label={t("yourName", { defaultValue: "Your name" })}
              placeholder={t("yourName", { defaultValue: "Your name" })}
              maxLength={MAX_COMMENT_AUTHOR_NAME_LENGTH}
              {...passwordManagerIgnoreProps}
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
            />
          )}
        </InputGroupAddon>
        <InputGroupTextarea
          required
          className="max-h-40 min-h-9"
          maxLength={MAX_COMMENT_LENGTH}
          aria-label={t("commentsComposerPlaceholder", {
            defaultValue: "Write a comment…",
          })}
          placeholder={t("commentsComposerPlaceholder", {
            defaultValue: "Write a comment…",
          })}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
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
              length={content.length}
              maxLength={MAX_COMMENT_LENGTH}
              label={t("charactersRemaining", {
                defaultValue:
                  "{count, plural, one {# character remaining} other {# characters remaining}}",
                count: MAX_COMMENT_LENGTH - content.length,
              })}
            />
            <InputGroupButton
              type="submit"
              size="icon-sm"
              variant="primary"
              aria-label={t("addComment", { defaultValue: "Add comment" })}
              loading={isSubmitting}
            >
              <ArrowUpIcon />
            </InputGroupButton>
          </div>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

function CommentItem({ comment }: { comment: VoteComment }) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = React.useState(false);

  return (
    <li data-testid="comment" className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-x-2">
        <OptimizedAvatarImage name={comment.authorName} size="sm" />
        <span className="min-w-0 truncate font-medium text-sm">
          {comment.authorName}
        </span>
        {comment.isOwn ? (
          <Badge>
            <Trans i18nKey="you" defaults="You" />
          </Badge>
        ) : null}
        {comment.canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="ml-auto shrink-0 text-muted-foreground"
            aria-label={t("commentDeleteLabel", {
              defaultValue: "Delete comment by {name}",
              name: comment.authorName,
            })}
            loading={isDeleting}
            onClick={async () => {
              if (isDeleting) return;
              setIsDeleting(true);
              const result = await runBallotAction(() =>
                deleteCommentAction({ commentId: comment.id }),
              );
              setIsDeleting(false);
              if (!result.ok) {
                toast.error(
                  t("actionErrorInternalServerError", {
                    defaultValue: "An internal server error occurred",
                  }),
                );
              }
            }}
          >
            <TrashIcon />
          </Button>
        ) : null}
      </div>
      <div className="mt-1 w-fit whitespace-pre-wrap pl-8 text-sm leading-relaxed">
        <TruncatedLinkify>{comment.content}</TruncatedLinkify>
      </div>
      <div className="mt-2 pl-8 text-muted-foreground text-xs">
        <RelativeTime value={comment.createdAt} />
      </div>
    </li>
  );
}

/** The sheet's content: the composer, then the comments newest first. */
export function VoteComments({
  pollId,
  comments,
  canComment,
  signedInName,
  defaultName,
}: {
  pollId: string;
  /** Oldest first. */
  comments: VoteComment[];
  /** False once the poll is scheduled: the thread stays readable. */
  canComment: boolean;
  signedInName?: string;
  defaultName?: string;
}) {
  const [hasCommented, setHasCommented] = React.useState(false);
  const newestFirst = [...comments].reverse();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {canComment ? (
        <div className="shrink-0 border-b p-4">
          {hasCommented ? (
            <output className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-muted-foreground text-sm">
              <CheckCircle2Icon className="size-4 text-green-600 dark:text-green-500" />
              <Trans
                i18nKey="commentsSheetSubmitted"
                defaults="Your comment has been added"
              />
            </output>
          ) : (
            <NewCommentForm
              pollId={pollId}
              signedInName={signedInName}
              defaultName={defaultName}
              onSubmitted={() => setHasCommented(true)}
            />
          )}
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-4">
        {newestFirst.length > 0 ? (
          <ul className="divide-y">
            {newestFirst.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </ul>
        ) : (
          <EmptyState className="grow">
            <EmptyStateIcon>
              <MessageCircleIcon />
            </EmptyStateIcon>
            <EmptyStateTitle>
              <Trans i18nKey="commentsSheetEmpty" defaults="No comments yet" />
            </EmptyStateTitle>
            {canComment ? (
              <EmptyStateDescription>
                <Trans
                  i18nKey="commentsSheetEmptyDescription"
                  defaults="Be the first to share your thoughts on this poll."
                />
              </EmptyStateDescription>
            ) : null}
          </EmptyState>
        )}
      </div>
    </div>
  );
}
