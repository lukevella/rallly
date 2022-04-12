import { Comment } from "@prisma/client";
import axios from "axios";

export interface CreateCommentPayload {
  pollId: string;
  content: string;
  authorName: string;
}

export const createComment = async (
  payload: CreateCommentPayload,
): Promise<Comment> => {
  const { data } = await axios.post<Comment>(
    `/api/poll/${payload.pollId}/comments`,
    payload,
  );
  return data;
};
