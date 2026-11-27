"use client";

import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { toast } from "@rallly/ui/sonner";
import { MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { useDeleteComment } from "@/features/poll/components/mutations";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import type { PollComment } from "@/features/poll/types";
import { Trans, useTranslation } from "@/i18n/client";
import { RelativeTime } from "@/lib/datetime/relative-time";
import { ChatBubble } from "./chat-bubble";

/**
 * Comments, oldest first, so the thread reads top to bottom. Laid out on the
 * same columns as the participants list.
 */
export function PollComments({ comments }: { comments: PollComment[] }) {
  return (
    <ul className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 text-sm">
      {comments.map((comment) => (
        <li
          key={comment.id}
          className="col-span-full grid grid-cols-subgrid items-center gap-y-2 border-button-outline border-b px-5 py-4 last:border-b-0"
        >
          <OptimizedAvatarImage size="sm" name={comment.authorName} />
          <span className="min-w-0 truncate">{comment.authorName}</span>
          <span className="whitespace-nowrap text-muted-foreground">
            <RelativeTime value={comment.createdAt} />
          </span>
          <CommentMenu comment={comment} />
          <div className="col-start-2 col-end-[-1]">
            <ChatBubble>
              <TruncatedLinkify>{comment.content}</TruncatedLinkify>
            </ChatBubble>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CommentMenu({ comment }: { comment: PollComment }) {
  const { t } = useTranslation();
  const deleteComment = useDeleteComment();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("commentMenu", {
              defaultValue: "Options for {name}'s comment",
              name: comment.authorName,
            })}
          />
        }
      >
        <MoreHorizontalIcon aria-hidden="true" />
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
                  defaultValue: "An internal server error occurred",
                }),
              );
            }
          }}
        >
          <TrashIcon />
          <Trans i18nKey="delete" defaults="Delete" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
