import z from "zod";

export const feedbackSchema = z.object({
  content: z.string().min(10).max(10000),
});

export type Feedback = z.infer<typeof feedbackSchema>;
