import * as z from "zod";
import {
  MAX_COMMENT_AUTHOR_NAME_LENGTH,
  MAX_COMMENT_LENGTH,
} from "@/features/poll/schema";

export const addCommentSchema = z.object({
  pollId: z.string(),
  authorName: z.string().trim().min(1).max(MAX_COMMENT_AUTHOR_NAME_LENGTH),
  content: z.string().trim().min(1).max(MAX_COMMENT_LENGTH),
});

export const deleteCommentSchema = z.object({
  commentId: z.string(),
});
