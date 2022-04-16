import { Transition } from "@headlessui/react";
import { Comment } from "@prisma/client";
import axios from "axios";
import { formatRelative } from "date-fns";
import { usePlausible } from "next-plausible";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useList } from "react-use";

import {
  createComment,
  CreateCommentPayload,
} from "../../api-client/create-comment";
import { requiredString } from "../../utils/form-validation";
import Button from "../button";
import CompactButton from "../compact-button";
import Dropdown, { DropdownItem } from "../dropdown";
import DotsHorizontal from "../icons/dots-horizontal.svg";
import Trash from "../icons/trash.svg";
import NameInput from "../name-input";
import TruncatedLinkify from "../poll/truncated-linkify";
import UserAvater from "../poll/user-avatar";
import { useUserName } from "../user-name-context";

export interface DiscussionProps {
  pollId: string;
  canDelete?: boolean;
}

interface CommentForm {
  authorName: string;
  content: string;
}

const Comments: React.VoidFunctionComponent<{
  comments: {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }[];
  deletedComments: string[];
  onDelete: (commentId: string) => void;
  canDelete?: boolean;
}> = ({ comments, deletedComments, onDelete, canDelete }) => {
  return (
    <div className="space-y-3 border-b bg-slate-50 p-4">
      {comments.map((comment, i) => {
        return (
          <div className="flex" key={i}>
            <Transition
              show={!deletedComments.includes(comment.id)}
              as="div"
              enter="transition transform duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="transition transform duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              className="w-fit rounded-xl border bg-white px-3 py-2 shadow-sm"
            >
              <div className="flex items-center space-x-2">
                <UserAvater name={comment.authorName} />
                <div className="mb-1">
                  <span className="mr-1">{comment.authorName}</span>
                  <span className="mr-1 text-slate-400">&bull;</span>
                  <span className="text-sm text-slate-500">
                    {formatRelative(new Date(comment.createdAt), Date.now())}
                  </span>
                </div>
                {canDelete ? (
                  <Dropdown
                    placement="bottom-start"
                    trigger={<CompactButton icon={DotsHorizontal} />}
                  >
                    <DropdownItem
                      icon={Trash}
                      label="Delete comment"
                      onClick={() => {
                        onDelete(comment.id);
                      }}
                    />
                  </Dropdown>
                ) : null}
              </div>
              <div className="w-fit whitespace-pre-wrap">
                <TruncatedLinkify>{comment.content}</TruncatedLinkify>
              </div>
            </Transition>
          </div>
        );
      })}
    </div>
  );
};

const Discussion: React.VoidFunctionComponent<DiscussionProps> = ({
  pollId,
  canDelete,
}) => {
  const getCommentsQueryKey = ["poll", pollId, "comments"];
  const [userName, setUserName] = useUserName();
  const [deletedComments, { push }] = useList<string>([]);
  const queryClient = useQueryClient();
  const { data: comments } = useQuery(
    getCommentsQueryKey,
    async () => {
      const res = await axios.get<{
        comments: Array<Omit<Comment, "createdAt"> & { createdAt: string }>;
      }>(`/api/poll/${pollId}/comments`);
      return res.data.comments;
    },
    {
      refetchInterval: 10000, // refetch every 10 seconds
    },
  );

  const plausible = usePlausible();

  const { mutate: createCommentMutation } = useMutation(
    (payload: CreateCommentPayload) => {
      // post comment
      return createComment(payload);
    },
    {
      onSuccess: (newComment) => {
        queryClient.setQueryData(getCommentsQueryKey, (comments) => {
          if (Array.isArray(comments)) {
            return [...comments, newComment];
          }
          return [newComment];
        });
        plausible("Created comment");
      },
    },
  );

  const { mutate: deleteCommentMutation } = useMutation(
    async (payload: { pollId: string; commentId: string }) => {
      await axios.delete(`/api/poll/${pollId}/comments/${payload.commentId}`);
    },
    {
      onMutate: ({ commentId }) => {
        push(commentId);
        plausible("Deleted comment");
      },
      onSuccess: () => {
        queryClient.invalidateQueries(getCommentsQueryKey);
      },
    },
  );

  const { register, setValue, control, handleSubmit, formState } =
    useForm<CommentForm>({
      defaultValues: {
        authorName: userName,
        content: "",
      },
    });

  React.useEffect(() => {
    setValue("authorName", userName);
  }, [setValue, userName]);

  const handleDelete = React.useCallback(
    (commentId: string) => {
      deleteCommentMutation({ pollId, commentId });
    },
    [deleteCommentMutation, pollId],
  );

  if (!comments) {
    return null;
  }

  return (
    <div className="overflow-hidden border-t border-b shadow-sm md:rounded-lg md:border">
      <div className="border-b bg-white px-4 py-2">
        <div className="font-medium">Comments</div>
      </div>
      {comments.length ? (
        <Comments
          comments={comments}
          canDelete={canDelete}
          onDelete={handleDelete}
          deletedComments={deletedComments}
        />
      ) : null}
      <form
        className="bg-white p-4"
        onSubmit={handleSubmit((data) => {
          return new Promise((resolve, reject) => {
            createCommentMutation(
              {
                ...data,
                pollId,
              },
              {
                onSuccess: () => {
                  setUserName(data.authorName);
                  setValue("content", "");
                  resolve(data);
                },
                onError: reject,
              },
            );
          });
        })}
      >
        <textarea
          id="comment"
          placeholder="Add your comment…"
          className="input w-full py-2 pl-3 pr-4"
          {...register("content", { validate: requiredString })}
        />
        <div className="mt-1 flex space-x-3">
          <Controller
            name="authorName"
            control={control}
            rules={{ validate: requiredString }}
            render={({ field }) => <NameInput className="w-full" {...field} />}
          />
          <Button
            htmlType="submit"
            loading={formState.isSubmitting}
            type="primary"
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(Discussion);
