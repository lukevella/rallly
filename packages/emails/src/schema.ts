import { z } from "zod";

export const sendEmailSchema = z.object({
  template: z.string(),
  options: z.any(),
});

export type SendEmailSchema = z.infer<typeof sendEmailSchema>;