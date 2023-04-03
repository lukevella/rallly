import { trpc } from "@rallly/backend";
import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import { usePostHog } from "@/utils/posthog";

import { useDayjs } from "../../utils/dayjs";
import { requiredString } from "../../utils/form-validation";
import { Button } from "../button";
import CompactButton from "../compact-button";
import Dropdown, { DropdownItem } from "../dropdown";
import DotsHorizontal from "../icons/dots-horizontal.svg";
import Trash from "../icons/trash.svg";
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
  const queryClient = trpc.useContext();
  const { t } = useTranslation("app");
  const { poll, admin } = usePoll();

  const pollId = poll.id;

  const { data: comments } = trpc.polls.comments.list.useQuery(
    { pollId },
    {
      refetchInterval: 10000, // refetch every 10 seconds
      trpc: {},
    },
  );
  const posthog = usePostHog();

  const addComment = trpc.polls.comments.add.useMutation({
    onSuccess: () => {
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

  if (!comments) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-md border shadow-sm">
      <div className="border-b bg-white p-3">
        <div className="font-medium">{t("comments")}</div>
      </div>
      <div
        className={clsx({
          "bg-pattern space-y-3 border-b p-3": comments.length > 0,
        })}
      >
        {comments.map((comment) => {
          const canDelete =
            admin || session.ownsObject(comment) || isUnclaimed(comment);

          return (
            <div className="flex" key={comment.id}>
              <div
                data-testid="comment"
                className="w-fit rounded-md border bg-white px-3 py-2 shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <UserAvatar
                    name={comment.authorName}
                    showName={true}
                    isYou={session.ownsObject(comment)}
                  />
                  <div className="mb-1">
                    <span className="mr-1 text-slate-500">&bull;</span>
                    <span className="text-sm text-slate-500">
                      {dayjs(new Date(comment.createdAt)).fromNow()}
                    </span>
                  </div>
                  {canDelete && (
                    <Dropdown
                      placement="bottom-start"
                      trigger={<CompactButton icon={DotsHorizontal} />}
                    >
                      <DropdownItem
                        icon={Trash}
                        label={t("deleteComment")}
                        onClick={() => {
                          deleteComment.mutate({
                            commentId: comment.id,
                          });
                        }}
                      />
                    </Dropdown>
                  )}
                </div>
                <div className="w-fit whitespace-pre-wrap">
                  <TruncatedLinkify>{comment.content}</TruncatedLinkify>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form
        className="bg-white p-3"
        onSubmit={handleSubmit(async ({ authorName, content }) => {
          await addComment.mutateAsync({ authorName, content, pollId });
          reset({ authorName, content: "" });
        })}
      >
        <textarea
          id="comment"
          placeholder={t("commentPlaceholder")}
          className="input w-full py-2 pl-3 pr-4"
          {...register("content", { validate: requiredString })}
        />
        <div className="mt-1 flex space-x-3">
          <div>
            <Controller
              name="authorName"
              key={session.user?.id}
              control={control}
              rules={{ validate: requiredString }}
              render={({ field }) => (
                <NameInput {...field} className="w-full" />
              )}
            />
          </div>
          <Button htmlType="submit" loading={formState.isSubmitting}>
            {t("comment")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(Discussion);
