import { trpc } from "@rallly/backend";
import { ChatIcon, DotsHorizontalIcon, TrashIcon } from "@rallly/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Textarea } from "@rallly/ui/textarea";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import { Trans } from "@/components/trans";
import { usePostHog } from "@/utils/posthog";

import { useDayjs } from "../../utils/dayjs";
import { requiredString } from "../../utils/form-validation";
import { LegacyButton } from "../button";
import NameInput from "../name-input";
import TruncatedLinkify from "../poll/truncated-linkify";
import UserAvatar from "../poll/user-avatar";
import { usePoll } from "../poll-context";
import { isUnclaimed, useUser } from "../user-provider";

interface CommentForm {
  authorName: string;
  content: string;
}

const Discussion: React.FunctionComponent = () => {
  const { dayjs } = useDayjs();
  const { t } = useTranslation();
  const { poll, admin } = usePoll();

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

  if (!comments) {
    return null;
  }

  return (
    <div className="divide-y">
      <div className="flex items-center gap-2 bg-gray-50 p-3 font-semibold tracking-tight">
        <ChatIcon className="h-5" /> {t("comments")} ({comments.length})
      </div>
      {comments.length ? (
        <div className="space-y-4 p-4">
          {comments.map((comment) => {
            const canDelete =
              admin || session.ownsObject(comment) || isUnclaimed(comment);

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
                              <DotsHorizontalIcon className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>
                              <Trans defaults="Menu" i18nKey="menu" />
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
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
              <LegacyButton
                onClick={() => {
                  reset();
                  setIsWriting(false);
                }}
              >
                {t("cancel")}
              </LegacyButton>
              <LegacyButton
                htmlType="submit"
                type="primary"
                loading={formState.isSubmitting}
              >
                <Trans defaults="Add Comment" i18nKey="addComment" />
              </LegacyButton>
            </div>
          </form>
        ) : (
          <button
            className="border-input text-muted-foreground flex w-full rounded border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
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
