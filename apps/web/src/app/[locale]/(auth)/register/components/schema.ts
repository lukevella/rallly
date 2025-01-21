import { z } from "zod";

export const registerNameFormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export type RegisterNameFormValues = z.infer<typeof registerNameFormSchema>;
