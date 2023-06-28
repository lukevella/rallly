import { trpc } from "@rallly/backend";
import {
  MessageCircleIcon,
  MoreHorizontalIcon,
  TrashIcon,
} from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Textarea } from "@rallly/ui/textarea";
import dayjs from "dayjs";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import { Trans } from "@/components/trans";
import { usePermissions } from "@/contexts/permissions";
import { useRole } from "@/contexts/role";
import { usePostHog } from "@/utils/posthog";

import { requiredString } from "../../utils/form-validation";
import NameInput from "../name-input";
import TruncatedLinkify from "../poll/truncated-linkify";
import UserAvatar from "../poll/user-avatar";
import { usePoll } from "../poll-context";
import { useUser } from "../user-provider";

interface CommentForm {
  authorName: string;
  content: string;
}

const Discussion: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const { poll } = usePoll();

  const pollId = poll.id;

  const { data: comments } = trpc.polls.comments.list.useQuery(
    { pollId },
    {
      staleTime: 1000 * 5,
    },
  );
  const posthog = usePostHog();

  const queryClient = trpc.useContext();

  const addComment = trpc.polls.comments.add.useMutation({
    onSuccess: () => {
      queryClient.polls.comments.invalidate();
      posthog?.capture("created comment");
    },
  });

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

  const { register, reset, control, handleSubmit, formState } =
    useForm<CommentForm>({
      defaultValues: {
        authorName: "",
        content: "",
      },
    });

  const [isWriting, setIsWriting] = React.useState(false);
  const role = useRole();
  const { isUser } = usePermissions();

  if (!comments) {
    return null;
  }

  return (
    <div className="divide-y">
      <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 font-semibold">
        <MessageCircleIcon className="h-5 w-5" /> {t("comments")} (
        {comments.length})
      </div>
      {comments.length ? (
        <div className="space-y-4 p-4">
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
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem
                              onClick={() => {
                                deleteComment.mutate({
                                  commentId: comment.id,
                                });
                              }}
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
                              <Trans i18nKey="delete" />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  <div className="w-fit whitespace-pre-wrap pl-8 leading-relaxed">
                    <TruncatedLinkify>{comment.content}</TruncatedLinkify>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      <div className="p-3">
        {isWriting ? (
          <form
            className="space-y-2.5"
            onSubmit={handleSubmit(async ({ authorName, content }) => {
              await addComment.mutateAsync({ authorName, content, pollId });
              reset({ authorName, content: "" });
              setIsWriting(false);
            })}
          >
            <div>
              <Textarea
                id="comment"
                autoFocus={true}
                placeholder={t("commentPlaceholder")}
                {...register("content", { validate: requiredString })}
              />
            </div>
            <div className="mb-2">
              <Controller
                name="authorName"
                key={session.user?.id}
                control={control}
                rules={{ validate: requiredString }}
                render={({ field }) => <NameInput {...field} />}
              />
            </div>
            <div className="flex justify-between gap-2">
              <Button
                onClick={() => {
                  reset();
                  setIsWriting(false);
                }}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={formState.isSubmitting}
              >
                <Trans defaults="Add Comment" i18nKey="addComment" />
              </Button>
            </div>
          </form>
        ) : (
          <button
            className="border-input text-muted-foreground flex w-full rounded border bg-transparent px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            onClick={() => setIsWriting(true)}
          >
            <Trans i18nKey="commentPlaceholder" />
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(Discussion);
