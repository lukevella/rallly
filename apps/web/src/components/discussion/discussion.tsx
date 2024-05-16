"use client";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { Textarea } from "@rallly/ui/textarea";
import dayjs from "dayjs";
import {
  MessageSquareOffIcon,
  MoreHorizontalIcon,
  TrashIcon,
} from "lucide-react";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import { useParticipants } from "@/components/participants-provider";
import { Trans } from "@/components/trans";
import { usePermissions } from "@/contexts/permissions";
import { usePoll } from "@/contexts/poll";
import { useRole } from "@/contexts/role";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";

import { requiredString } from "../../utils/form-validation";
import NameInput from "../name-input";
import TruncatedLinkify from "../poll/truncated-linkify";
import UserAvatar from "../poll/user-avatar";
import { useUser } from "../user-provider";

interface CommentForm {
  authorName: string;
  content: string;
}

function NewCommentForm({
  onSubmit,
  onCancel,
}: {
  onSubmit?: () => void;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const poll = usePoll();
  const { user } = useUser();
  const { participants } = useParticipants();

  const authorName = React.useMemo(() => {
    if (user.isGuest) {
      const participant = participants.find((p) => p.userId === user.id);
      return participant?.name ?? "";
    } else {
      return user.name;
    }
  }, [user, participants]);

  const pollId = poll.id;

  const posthog = usePostHog();

  const queryClient = trpc.useUtils();

  const addComment = trpc.polls.comments.add.useMutation({
    onSuccess: () => {
      queryClient.polls.comments.invalidate();
      posthog?.capture("created comment");
    },
  });

  const session = useUser();

  const { register, reset, control, handleSubmit, formState } =
    useForm<CommentForm>({
      defaultValues: {
        authorName,
        content: "",
      },
    });

  return (
    <form
      className="w-full space-y-2.5"
      onSubmit={handleSubmit(async ({ authorName, content }) => {
        await addComment.mutateAsync({ authorName, content, pollId });
        reset({ authorName, content: "" });
        onSubmit?.();
      })}
    >
      <div>
        <Textarea
          id="comment"
          className="w-full"
          autoFocus={true}
          placeholder={t("commentPlaceholder")}
          {...register("content", { validate: requiredString })}
        />
      </div>
      <div
        className={cn("mb-2", {
          hidden: !user.isGuest,
        })}
      >
        <Controller
          name="authorName"
          key={session.user?.id}
          control={control}
          rules={{ validate: requiredString }}
          render={({ field }) => (
            <NameInput error={!!formState.errors.authorName} {...field} />
          )}
        />
      </div>
      <div className="flex gap-2.5">
        <Button
          type="submit"
          variant="primary"
          loading={formState.isSubmitting}
        >
          <Trans defaults="Add Comment" i18nKey="addComment" />
        </Button>
        <Button
          onClick={() => {
            reset();
            onCancel?.();
          }}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

function DiscussionInner() {
  const { t } = useTranslation();
  const poll = usePoll();

  const pollId = poll.id;

  const { data: comments } = trpc.polls.comments.list.useQuery(
    { pollId },
    {
      staleTime: 1000 * 5,
    },
  );
  const posthog = usePostHog();

  const queryClient = trpc.useUtils();

  const deleteComment = trpc.polls.comments.delete.useMutation({
    onMutate: ({ commentId }) => {
      queryClient.polls.comments.list.setData(
        { pollId },
        (existingComments = []) => {
          return [...existingComments].filter(({ id }) => id !== commentId);
        },
      );
    },
    onSuccess: () => {
      posthog?.capture("deleted comment");
    },
  });

  const session = useUser();

  const [isWriting, setIsWriting] = React.useState(false);
  const role = useRole();
  const { isUser } = usePermissions();

  if (!comments) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("comments")}
          <Badge>{comments.length}</Badge>
        </CardTitle>
      </CardHeader>
      {comments.length ? (
        <CardContent className="border-b">
          <div className="space-y-4">
            {comments.map((comment) => {
              const canDelete =
                role === "admin" || (comment.userId && isUser(comment.userId));

              return (
                <div className="" key={comment.id}>
                  <div data-testid="comment">
                    <div className="mb-1 flex items-center space-x-2">
                      <UserAvatar
                        name={comment.authorName}
                        showName={true}
                        isYou={session.ownsObject(comment)}
                      />
                      <div className="flex items-center gap-2 text-sm ">
                        <div className="text-gray-500">
                          {dayjs(comment.createdAt).fromNow()}
                        </div>
                        {canDelete && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild={true}>
                              <button className="hover:text-foreground text-gray-500">
                                <MoreHorizontalIcon className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  deleteComment.mutate({
                                    commentId: comment.id,
                                  });
                                }}
                              >
                                <TrashIcon className="size-4" />
                                <Trans i18nKey="delete" />
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    <div className="ml-0.5 w-fit whitespace-pre-wrap pl-7 text-sm leading-relaxed">
                      <TruncatedLinkify>{comment.content}</TruncatedLinkify>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      ) : null}
      {!poll.event ? (
        <CardFooter className="border-t-0">
          {isWriting ? (
            <NewCommentForm
              onSubmit={() => {
                setIsWriting(false);
              }}
              onCancel={() => {
                setIsWriting(false);
              }}
            />
          ) : (
            <button
              className="border-input text-muted-foreground flex w-full rounded border bg-transparent px-2 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              onClick={() => setIsWriting(true)}
            >
              <Trans
                i18nKey="commentPlaceholder"
                defaults="Leave a comment on this poll (visible to everyone)"
              />
            </button>
          )}
        </CardFooter>
      ) : null}
    </Card>
  );
}

export default function Discussion() {
  const poll = usePoll();
  if (poll.disableComments) {
    return (
      <p className="text-muted-foreground rounded-lg bg-gray-100 p-4 text-center text-sm">
        <Icon>
          <MessageSquareOffIcon className="mr-2 inline-block" />
        </Icon>
        <Trans
          i18nKey="commentsDisabled"
          defaults="Comments have been disabled"
        />
      </p>
    );
  }
  return <DiscussionInner />;
}
